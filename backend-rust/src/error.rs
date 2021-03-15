use thiserror::Error;

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
