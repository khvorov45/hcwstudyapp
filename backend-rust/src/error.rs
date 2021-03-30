use crate::data::current;
use thiserror::Error;
use warp::http::StatusCode;

#[derive(Error, Debug)]
pub enum Conflict {
    #[error("PK in table {0} conflict; value: {1}")]
    PrimaryKey(String, String),
    #[error("FK in table {0} (parent table {1}) conflict; value: {2}")]
    ForeignKey(String, String, String),
    #[error("Wrong token kind: {0:?}")]
    WrongTokenKind(current::TokenKind),
    #[error("Unexpected redcap data: {0:#?}, expected: {1}")]
    UnexpectedRedcapData(serde_json::Value, String),
}

#[derive(Error, Debug)]
pub enum Unauthorized {
    #[error("Wrong auth type, expected Bearer, got {0}")]
    WrongAuthType(String),
    #[error("No such token")]
    NoSuchToken(String),
    #[error("Token expired")]
    TokenExpired(String),
    #[error("No user with the supplied token")]
    NoUserWithToken(String),
    #[error("Insufficient access: {0:?}, expected at least: {1:?}")]
    InsufficientAccess(current::AccessGroup, current::AccessGroup),
}

#[derive(Debug)]
pub struct ApiProblem {
    pub status: StatusCode,
    pub detail: String,
}

impl warp::reject::Reject for ApiProblem {}

pub fn from_anyhow(err: anyhow::Error) -> ApiProblem {
    let status = match &err {
        _ if err.is::<Unauthorized>() => StatusCode::UNAUTHORIZED,
        _ if err.is::<Conflict>() => StatusCode::CONFLICT,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    };
    ApiProblem {
        status,
        detail: format!("{}", err),
    }
}
