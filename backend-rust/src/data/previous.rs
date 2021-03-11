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
