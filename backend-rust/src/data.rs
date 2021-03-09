use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub enum Site {
    Melbourne,
    Sydney,
    Adelaide,
    Brisbane,
    Newcastle,
    Perth,
}

#[derive(Serialize, Deserialize)]
pub enum AccessGroup {
    Site(Site),
    Unrestricted,
    Admin,
}

#[derive(Serialize, Deserialize)]
pub enum UserKind {
    Redcap,
    Manual,
}

#[derive(Serialize, Deserialize)]
pub struct User {
    email: String,
    access_group: AccessGroup,
    kind: UserKind,
    deidentified_export: bool,
}
