use crate::db::PrimaryKey;
use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub enum Site {
    Melbourne,
    Sydney,
    Adelaide,
    Brisbane,
    Newcastle,
    Perth,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum AccessGroup {
    Site(Site),
    Unrestricted,
    Admin,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum UserKind {
    Redcap,
    Manual,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub email: String,
    pub access_group: AccessGroup,
    pub kind: UserKind,
    pub deidentified_export: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum TokenType {
    Session,
    Api,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Token {
    pub user: String,
    pub token: String,
    #[serde(rename = "type")]
    pub type_: TokenType,
    pub expires: DateTime<Utc>,
}

impl PrimaryKey<String> for User {
    fn get_pk(&self) -> String {
        self.email.clone()
    }
}

impl PrimaryKey<String> for Token {
    fn get_pk(&self) -> String {
        self.token.clone()
    }
}
