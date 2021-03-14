use crate::{auth, db, error};
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::Mutex;
use warp::{http::StatusCode, Filter, Rejection, Reply};

type Db = Arc<Mutex<db::Db>>;

pub fn routes(db: Db) -> impl Filter<Extract = impl Reply, Error = Infallible> + Clone {
    get_users(db.clone())
        .or(auth_token_verify(db))
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
                Err(e) => Err(warp::reject::custom(e)),
            }
        })
}

fn auth_header() -> impl Filter<Extract = (String,), Error = Rejection> + Clone {
    warp::header::<String>("Authorization").and_then(move |tok_raw: String| async move {
        match auth::parse_bearer_header(tok_raw.as_str()) {
            Ok(t) => Ok(t.to_string()),
            Err(e) => Err(warp::reject::custom(e)),
        }
    })
}

async fn handle_rejection(err: Rejection) -> Result<impl Reply, Infallible> {
    let status;
    let message;
    log::debug!("recover filter error: {:?}", err);

    if let Some(e) = err.find::<error::Unauthorized>() {
        status = StatusCode::UNAUTHORIZED;
        message = format!("{:?}", e);
    } else {
        status = StatusCode::INTERNAL_SERVER_ERROR;
        message = format!("UNHANDLED REJECTION: {:?}", err);
        log::error!("{}", message);
    }

    let json = warp::reply::json(&message);
    Ok(warp::reply::with_status(json, status))
}
