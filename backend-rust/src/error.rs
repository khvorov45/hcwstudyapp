use http_api_problem::HttpApiProblem;
use thiserror::Error;
use warp::http::StatusCode;

#[derive(Error, Debug)]
pub enum Conflict {
    #[error("PK in table {0} conflict; value: {1}")]
    PrimaryKey(String, String),
    #[error("FK in table {0} (parent table {1}) conflict; value: {2}")]
    ForeignKey(String, String, String),
}

#[derive(Error, Debug)]
pub enum Unauthorized {
    #[error("Wrong auth type, expected Bearer, got {0}")]
    WrongAuthType(String),
    #[error("No such token")]
    NoSuchToken(String),
    #[error("TokenExpired")]
    TokenExpired(String),
    #[error("NoUserWithToken")]
    NoUserWithToken(String),
}

impl warp::reject::Reject for Unauthorized {}
impl warp::reject::Reject for Conflict {}

pub fn from_anyhow(err: anyhow::Error) -> HttpApiProblem {
    if let Some(e) = err.downcast_ref::<HttpApiProblem>() {
        return e.clone();
    }

    let status = match &err {
        _ if err.is::<Unauthorized>() => StatusCode::UNAUTHORIZED,
        _ if err.is::<Conflict>() => StatusCode::CONFLICT,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    };

    HttpApiProblem::with_title_and_type_from_status(status).set_detail(format!("{}", err))
}
