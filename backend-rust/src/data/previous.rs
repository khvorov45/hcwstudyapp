use crate::data::current;
use crate::db::ToCurrent;
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

// ================================================================================================

impl ToCurrent<current::UserKind> for UserKind {
    fn to_current(&self) -> current::UserKind {
        use UserKind::*;
        match self {
            Redcap => current::UserKind::Redcap,
            Manual => current::UserKind::Manual,
        }
    }
}

impl ToCurrent<current::Site> for Site {
    fn to_current(&self) -> current::Site {
        use Site::*;
        match self {
            Melbourne => current::Site::Melbourne,
            Sydney => current::Site::Sydney,
            Adelaide => current::Site::Adelaide,
            Brisbane => current::Site::Brisbane,
            Newcastle => current::Site::Newcastle,
            Perth => current::Site::Perth,
        }
    }
}

impl ToCurrent<current::AccessGroup> for AccessGroup {
    fn to_current(&self) -> current::AccessGroup {
        use AccessGroup::*;
        match self {
            Site(site) => current::AccessGroup::Site(site.to_current()),
            Unrestricted => current::AccessGroup::Unrestricted,
            Admin => current::AccessGroup::Admin,
        }
    }
}

impl ToCurrent<current::User> for User {
    fn to_current(&self) -> current::User {
        current::User {
            email: self.email.clone(),
            access_group: self.access_group.to_current(),
            kind: self.kind.to_current(),
            deidentified_export: self.deidentified_export,
        }
    }
}
