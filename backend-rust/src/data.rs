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
    email: String,
    access_group: AccessGroup,
    kind: UserKind,
    deidentified_export: bool,
}

impl crate::db::ToCurrent<User> for User {
    fn to_current(&self) -> User {
        self.clone()
    }
}
