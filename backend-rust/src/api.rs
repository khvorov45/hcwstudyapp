use crate::db;
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::Mutex;
use warp::Filter;

pub type Db = Arc<Mutex<db::Db>>;

pub fn routes(db: Db) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    get_users(db)
}

pub fn get_users(
    db: Db,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    async fn handler(db: Db) -> Result<impl warp::Reply, Infallible> {
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
