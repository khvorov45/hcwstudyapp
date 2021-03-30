use crate::{
    auth,
    db::{ForeignKey, PrimaryKey},
};
use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, PartialOrd, Copy)]
pub enum Site {
    Melbourne,
    Sydney,
    Adelaide,
    Brisbane,
    Newcastle,
    Perth,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, PartialOrd, Copy)]
pub enum AccessGroup {
    Site(Site),
    Unrestricted,
    Admin,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum UserKind {
    Redcap,
    Manual,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub email: String,
    pub access_group: AccessGroup,
    pub kind: UserKind,
    pub deidentified_export: bool,
}

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Debug)]
pub enum TokenKind {
    Session,
    Api,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Token {
    pub user: String,
    pub hash: String,
    pub kind: TokenKind,
    pub expires: Option<DateTime<Utc>>,
}

impl PrimaryKey<String> for User {
    fn get_pk(&self) -> String {
        self.email.clone()
    }
}

impl PrimaryKey<String> for Token {
    fn get_pk(&self) -> String {
        self.hash.clone()
    }
}

impl ForeignKey<String> for Token {
    fn get_fk(&self) -> String {
        self.user.clone()
    }
}

impl Token {
    pub fn new(email: &str, kind: TokenKind, len: usize, days_to_live: i64) -> (String, Self) {
        let before_hash = auth::random_string(len);
        let expires = match kind {
            TokenKind::Session => Some(chrono::Utc::now() + chrono::Duration::days(days_to_live)),
            TokenKind::Api => None,
        };
        let token = Self {
            user: email.to_string(),
            hash: auth::hash(before_hash.as_str()),
            kind,
            expires,
        };
        (before_hash, token)
    }
    pub fn is_expired(&self) -> bool {
        if self.expires.is_none() {
            return false;
        }
        self.expires.unwrap() < chrono::Utc::now()
    }
}
