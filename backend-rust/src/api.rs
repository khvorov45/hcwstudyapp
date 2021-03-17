use crate::{
    auth,
    data::current,
    db,
    email::{self, Email},
    error,
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
    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(&[Method::GET, Method::POST, Method::DELETE, Method::PUT])
        .allow_headers(vec!["Authorization", "Content-Type"]);
    get_users(db.clone())
        .or(auth_token_verify(db.clone()))
        .or(auth_token_send(db.clone(), opt.clone(), mailer))
        .or(auth_token_refresh(db, opt))
        .with(cors.clone())
        .recover(handle_rejection)
        .with(cors)
}

fn get_users(db: Db) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    async fn handler(db: Db) -> Result<impl Reply, Infallible> {
        Ok(warp::reply::json(&db.lock().await.users.current.data))
    }
    warp::path!("users")
        .and(warp::get())
        .and(with_db(db))
        .and_then(handler)
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

fn auth_header() -> impl Filter<Extract = (String,), Error = Rejection> + Clone {
    warp::header::<String>("Authorization").and_then(move |tok_raw: String| async move {
        match auth::parse_bearer_header(tok_raw.as_str()) {
            Ok(t) => Ok(t.to_string()),
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
        #[serde(rename = "type")]
        type_: current::TokenType,
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
                    query.email.as_str(),
                    query.type_,
                    opt.auth_token_length,
                    opt.auth_token_days_to_live,
                );
                match db.lock().await.insert_token(token) {
                    Ok(()) => {
                        let link = format!("{}/?token={}", opt.frontend_root, before_hash);
                        let email = Email {
                            to: query.email,
                            subject: "NIH HCW Study Access Link".to_string(),
                            body: format!(
                                "<p>NIH HCW Flu study access link:</p><br/><a href={0}>{0}</a>",
                                link
                            ),
                        };
                        match email.send(mailer).await {
                            Ok(()) => Ok(reply_no_content()),
                            Err(e) => Err(reject(e)),
                        }
                    }
                    Err(e) => Err(reject(e)),
                }
            },
        )
}

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
