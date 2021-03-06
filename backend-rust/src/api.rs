use crate::{
    auth,
    data::current,
    db,
    email::{self, Email},
    error, redcap,
};
use serde_derive::Deserialize;
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::Mutex;
use warp::{
    http::{Method, StatusCode},
    Filter, Rejection, Reply,
};

type Db = Arc<Mutex<db::Db>>;
type Mailer = Arc<email::Mailer>;
type Opt = Arc<crate::Opt>;

pub fn routes(
    db: Db,
    opt: Opt,
    mailer: Mailer,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let base_routes = get_users(db.clone())
        .or(get_bleed(db.clone()))
        .or(bleed_redcap_sync(db.clone(), opt.clone()))
        .or(get_year_change(db.clone()))
        .or(year_change_redcap_sync(db.clone(), opt.clone()))
        .or(get_consent(db.clone()))
        .or(consent_redcap_sync(db.clone(), opt.clone()))
        .or(check_quality(db.clone()))
        .or(get_virus(db.clone()))
        .or(get_serology(db.clone()))
        .or(get_withdrawn(db.clone()))
        .or(withdrawn_redcap_sync(db.clone(), opt.clone()))
        .or(get_weekly_survey(db.clone()))
        .or(weekly_survey_redcap_sync(db.clone(), opt.clone()))
        .or(get_participants(db.clone()))
        .or(participants_redcap_sync(db.clone(), opt.clone()))
        .or(get_vaccination_history(db.clone()))
        .or(vaccination_history_redcap_sync(db.clone(), opt.clone()))
        .or(get_schedule(db.clone()))
        .or(schedule_redcap_sync(db.clone(), opt.clone()))
        .or(users_redcap_sync(db.clone(), opt.clone()))
        .or(auth_token_verify(db.clone()))
        .or(auth_token_send(db.clone(), opt.clone(), mailer))
        .or(auth_token_refresh(db, opt));

    let base_routes_with_prefix = warp::path("api").and(base_routes);

    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(&[Method::GET, Method::POST, Method::DELETE, Method::PUT])
        .allow_headers(vec!["Authorization", "Content-Type"]);

    let log = warp::log("api");

    base_routes_with_prefix
        .recover(handle_rejection)
        .with(cors)
        .with(log)
}

fn with_db(db: Db) -> impl Filter<Extract = (Db,), Error = Infallible> + Clone {
    warp::any().map(move || db.clone())
}

fn with_mailer(mailer: Mailer) -> impl Filter<Extract = (Mailer,), Error = Infallible> + Clone {
    warp::any().map(move || mailer.clone())
}

fn with_opt(opt: Opt) -> impl Filter<Extract = (Opt,), Error = Infallible> + Clone {
    warp::any().map(move || opt.clone())
}

fn auth_header() -> impl Filter<Extract = (String,), Error = Rejection> + Clone {
    warp::header::<String>("Authorization").and_then(move |tok_raw: String| async move {
        match auth::parse_bearer_header(tok_raw.as_str()) {
            Ok(t) => Ok(t.to_string()),
            Err(e) => Err(reject(e)),
        }
    })
}

fn reply_no_content() -> impl warp::Reply {
    warp::reply::with_status(warp::reply(), StatusCode::NO_CONTENT)
}

/// Makes sure all rejections are HttpApiProblem
fn reject(e: anyhow::Error) -> Rejection {
    warp::reject::custom(error::from_anyhow(e))
}

/// Expect all rejections to be HttpApiProblem
async fn handle_rejection(err: Rejection) -> Result<impl Reply, Rejection> {
    log::debug!("recover filter error: {:?}", err);

    if let Some(e) = err.find::<error::ApiProblem>() {
        let reply = warp::reply::with_status(e.detail.clone(), e.status);
        return Ok(reply);
    }

    Err(err)
}

fn user_from_token(
    db: Db,
) -> impl Filter<Extract = (current::User,), Error = warp::Rejection> + Clone {
    auth_header()
        .and(with_db(db))
        .and_then(move |tok: String, db: Db| async move {
            match db.lock().await.token_verify(tok.as_str()) {
                Ok(u) => Ok(u),
                Err(e) => Err(reject(e)),
            }
        })
}

fn sufficient_access(
    db: Db,
    req_access: current::AccessGroup,
) -> impl Filter<Extract = (current::User,), Error = warp::Rejection> + Clone {
    user_from_token(db).and_then(move |u: current::User| async move {
        if u.access_group < req_access {
            return Err(reject(anyhow::Error::new(
                error::Unauthorized::InsufficientAccess(u.access_group, req_access),
            )));
        }
        Ok(u)
    })
}

// Tokens =========================================================================================

fn auth_token_refresh(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("auth" / "token")
        .and(warp::put())
        .and(auth_header())
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |old_token: String, db: Db, opt: Opt| async move {
            match db.lock().await.token_refresh(
                old_token.as_str(),
                opt.auth_token_length,
                opt.auth_token_days_to_live,
            ) {
                Ok(token) => Ok(token),
                Err(e) => Err(reject(e)),
            }
        })
}

fn auth_token_send(
    db: Db,
    opt: Opt,
    mailer: Mailer,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    #[derive(Deserialize)]
    struct Query {
        email: String,
        kind: current::TokenKind,
    }
    warp::path!("auth" / "token" / "send")
        .and(warp::post())
        .and(warp::query())
        .and(with_db(db))
        .and(with_opt(opt))
        .and(with_mailer(mailer))
        .and_then(
            move |query: Query, db: Db, opt: Opt, mailer: Mailer| async move {
                let (before_hash, token) = current::Token::new(
                    query.email.to_lowercase().as_str(),
                    query.kind,
                    opt.auth_token_length,
                    opt.auth_token_days_to_live,
                );
                match db.lock().await.insert_token(token) {
                    Ok(()) => {}
                    Err(e) => return Err(reject(e)),
                }
                let content = match query.kind {
                    current::TokenKind::Session => {
                        let link = format!("{}/?token={}", opt.frontend_root, before_hash);
                        format!("<a href={0}>{0}</a>", link)
                    }
                    current::TokenKind::Api => before_hash,
                };
                let title = match query.kind {
                    current::TokenKind::Session => "access link",
                    current::TokenKind::Api => "API token",
                };
                let email = Email {
                    to: query.email,
                    subject: format!("NIH HCW Study {}", title),
                    body: format!("<p>NIH HCW Flu study {}:</p><br/>{}", title, content),
                };
                match email.send(mailer).await {
                    Ok(()) => Ok(reply_no_content()),
                    Err(e) => Err(reject(e)),
                }
            },
        )
}

fn auth_token_verify(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("auth" / "token" / "verify")
        .and(warp::get())
        .and(auth_header())
        .and(with_db(db))
        .and_then(move |token: String, db: Db| async move {
            match db.lock().await.token_verify(token.as_str()) {
                Ok(u) => Ok(warp::reply::json(&u)),
                Err(e) => Err(reject(e)),
            }
        })
}

// Users ==========================================================================================

fn get_users(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(_u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        Ok(warp::reply::json(&db.lock().await.users.current.data))
    }
    warp::path!("users")
        .and(warp::get())
        .and(sufficient_access(db.clone(), current::AccessGroup::Admin))
        .and(with_db(db))
        .and_then(handler)
}

fn users_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("users" / "redcap" / "sync")
        .and(warp::put())
        .and(sufficient_access(db.clone(), current::AccessGroup::Admin))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let redcap_users = match redcap::export_users(&opt).await {
                Ok(u) => u,
                Err(e) => return Err(reject(e)),
            };
            match db.lock().await.sync_redcap_users(redcap_users) {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}

// Particiapants ==================================================================================

fn get_participants(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let data = &db.lock().await.participants.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|p| p.site == site)
                    .collect::<Vec<&current::Participant>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("participants")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

fn participants_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("participants" / "redcap" / "sync")
        .and(warp::put())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let redcap_participants = match redcap::export_participants(&opt).await {
                Ok(u) => u,
                Err(e) => return Err(reject(e)),
            };
            match db
                .lock()
                .await
                .sync_redcap_participants(redcap_participants)
            {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}

// Vaccination history ============================================================================

fn get_vaccination_history(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.vaccination_history.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            let participants = db.get_participants_subset(site);
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|v| participants.iter().any(|p| p.pid == v.pid))
                    .collect::<Vec<&current::VaccinationHistory>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("vaccination")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

fn vaccination_history_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("vaccination" / "redcap" / "sync")
        .and(warp::put())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let pid_map = match redcap::export_record_id_pid_map(&opt).await {
                Ok(map) => map,
                Err(e) => return Err(reject(e)),
            };
            let redcap_vaccination_history =
                match redcap::export_vaccination_history(&opt, &pid_map).await {
                    Ok(u) => u,
                    Err(e) => return Err(reject(e)),
                };
            match db
                .lock()
                .await
                .sync_redcap_vaccination_history(redcap_vaccination_history)
            {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}

// Schedule =======================================================================================

fn get_schedule(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.schedule.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            let participants = db.get_participants_subset(site);
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|v| participants.iter().any(|p| p.pid == v.pid))
                    .collect::<Vec<&current::Schedule>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("schedule")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

fn schedule_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("schedule" / "redcap" / "sync")
        .and(warp::put())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let redcap_schedule = match redcap::export_schedule(&opt).await {
                Ok(u) => u,
                Err(e) => return Err(reject(e)),
            };
            match db.lock().await.sync_redcap_schedule(redcap_schedule) {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}

// Weekly survey ==================================================================================

fn get_weekly_survey(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.weekly_survey.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            let participants = db.get_participants_subset(site);
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|v| participants.iter().any(|p| p.pid == v.pid))
                    .collect::<Vec<&current::WeeklySurvey>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("weekly-survey")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

fn weekly_survey_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("weekly-survey" / "redcap" / "sync")
        .and(warp::put())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let pid_map = match redcap::export_record_id_pid_map(&opt).await {
                Ok(map) => map,
                Err(e) => return Err(reject(e)),
            };
            let redcap_weekly_survey = match redcap::export_weekly_survey(&opt, &pid_map).await {
                Ok(u) => u,
                Err(e) => return Err(reject(e)),
            };
            match db
                .lock()
                .await
                .sync_redcap_weekly_survey(redcap_weekly_survey)
            {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}

// Withdrawn ======================================================================================

fn get_withdrawn(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.withdrawn.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            let participants = db.get_participants_subset(site);
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|v| participants.iter().any(|p| p.pid == v.pid))
                    .collect::<Vec<&current::Withdrawn>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("withdrawn")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

fn withdrawn_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("withdrawn" / "redcap" / "sync")
        .and(warp::put())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let pid_map = match redcap::export_record_id_pid_map(&opt).await {
                Ok(map) => map,
                Err(e) => return Err(reject(e)),
            };
            let redcap_withdrawn = match redcap::export_withdrawn(&opt, &pid_map).await {
                Ok(u) => u,
                Err(e) => return Err(reject(e)),
            };
            match db.lock().await.sync_redcap_withdrawn(redcap_withdrawn) {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}

// Virus ==========================================================================================

fn get_virus(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(_u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.virus.current.data;
        Ok(warp::reply::json(data))
    }
    warp::path!("virus")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

// Serology =======================================================================================

fn get_serology(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.serology.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            let participants = db.get_participants_subset(site);
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|v| participants.iter().any(|p| p.pid == v.pid))
                    .collect::<Vec<&current::Serology>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("serology")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

// Data quality ====================================================================================

fn check_quality(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(user: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let mut db = db.lock().await;
        let issues = db.find_table_issues(user.access_group);
        Ok(warp::reply::json(&issues))
    }
    warp::path!("check-quality")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

// Year change ======================================================================================

fn get_consent(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.consent.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            let participants = db.get_participants_subset(site);
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|v| participants.iter().any(|p| p.pid == v.pid))
                    .collect::<Vec<&current::Consent>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("consent")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

fn consent_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("consent" / "redcap" / "sync")
        .and(warp::put())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let redcap_consent = match redcap::export_consent(&opt).await {
                Ok(u) => u,
                Err(e) => return Err(reject(e)),
            };
            match db.lock().await.sync_redcap_consent(redcap_consent) {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}

// Year change ======================================================================================

fn get_year_change(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.year_change.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            let participants = db.get_participants_subset(site);
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|v| {
                        participants
                            .iter()
                            .any(|p| p.pid == v.pid.as_ref().map(|s| s.as_ref()).unwrap_or(""))
                    })
                    .collect::<Vec<&current::YearChange>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("year-change")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

fn year_change_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("year-change" / "redcap" / "sync")
        .and(warp::put())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let redcap_year_change = match redcap::export_year_change(&opt).await {
                Ok(u) => u,
                Err(e) => return Err(reject(e)),
            };
            match db.lock().await.sync_redcap_year_change(redcap_year_change) {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}

// Year change ======================================================================================

fn get_bleed(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(u: current::User, db: Db) -> Result<impl Reply, Infallible> {
        let db = db.lock().await;
        let data = &db.bleed.current.data;
        if let current::AccessGroup::Site(site) = u.access_group {
            let participants = db.get_participants_subset(site);
            Ok(warp::reply::json(
                &data
                    .iter()
                    .filter(|v| participants.iter().any(|p| p.pid == v.pid))
                    .collect::<Vec<&current::Bleed>>(),
            ))
        } else {
            Ok(warp::reply::json(data))
        }
    }
    warp::path!("bleed")
        .and(warp::get())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and_then(handler)
}

fn bleed_redcap_sync(
    db: Db,
    opt: Opt,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path!("bleed" / "redcap" / "sync")
        .and(warp::put())
        .and(user_from_token(db.clone()))
        .and(with_db(db))
        .and(with_opt(opt))
        .and_then(move |_u: current::User, db: Db, opt: Opt| async move {
            let redcap_bleed = match redcap::export_bleeds(&opt).await {
                Ok(u) => u,
                Err(e) => return Err(reject(e)),
            };
            match db.lock().await.sync_redcap_bleed(redcap_bleed) {
                Ok(()) => Ok(reply_no_content()),
                Err(e) => Err(reject(e)),
            }
        })
}
