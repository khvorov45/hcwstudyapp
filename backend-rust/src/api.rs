use crate::{auth, data::current, db, error};
use http_api_problem::HttpApiProblem;
use serde_derive::Deserialize;
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::Mutex;
use warp::{http::StatusCode, Filter, Rejection, Reply};

type Db = Arc<Mutex<db::Db>>;

pub fn routes(
    db: Db,
    token_len: usize,
    token_days_to_live: i64,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    get_users(db.clone())
        .or(auth_token_verify(db.clone()))
        .or(auth_token_send(db, token_len, token_days_to_live))
        .recover(handle_rejection)
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
    len: usize,
    days_to_live: i64,
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
        .and_then(move |query: Query, db: Db| async move {
            let (before_hash, token) =
                current::Token::new(query.email.as_str(), query.type_, len, days_to_live);
            log::info!("TEMPORARY: token to be sent is {}", before_hash);
            match db.lock().await.insert_token(token) {
                Ok(()) => Ok(reply_no_content()),
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

    if let Some(e) = err.find::<HttpApiProblem>() {
        let code = e.status.unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        let reply = warp::reply::json(e);
        let reply = warp::reply::with_status(reply, code);
        let reply = warp::reply::with_header(
            reply,
            warp::http::header::CONTENT_TYPE,
            http_api_problem::PROBLEM_JSON_MEDIA_TYPE,
        );
        return Ok(reply);
    }

    Err(err)
}
