use crate::db::ToCurrent;

pub mod current;
pub mod previous;

impl ToCurrent<current::UserKind> for previous::UserKind {
    fn to_current(&self) -> current::UserKind {
        use previous::UserKind::*;
        match self {
            Redcap => current::UserKind::Redcap,
            Manual => current::UserKind::Manual,
        }
    }
}

impl ToCurrent<current::Site> for previous::Site {
    fn to_current(&self) -> current::Site {
        use previous::Site::*;
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

impl ToCurrent<current::AccessGroup> for previous::AccessGroup {
    fn to_current(&self) -> current::AccessGroup {
        use previous::AccessGroup::*;
        match self {
            Site(site) => current::AccessGroup::Site(site.to_current()),
            Unrestricted => current::AccessGroup::Unrestricted,
            Admin => current::AccessGroup::Admin,
        }
    }
}

impl ToCurrent<current::User> for previous::User {
    fn to_current(&self) -> current::User {
        current::User {
            email: self.email.clone(),
            access_group: self.access_group.to_current(),
            kind: self.kind.to_current(),
            deidentified_export: self.deidentified_export,
        }
    }
}

impl ToCurrent<current::TokenType> for previous::TokenType {
    fn to_current(&self) -> current::TokenType {
        use previous::TokenType::*;
        match self {
            Session => current::TokenType::Session,
            Api => current::TokenType::Api,
        }
    }
}

impl ToCurrent<current::Token> for previous::Token {
    fn to_current(&self) -> current::Token {
        current::Token {
            user: self.user.clone(),
            token: self.token.clone(),
            type_: self.type_.to_current(),
            expires: self.expires,
        }
    }
}
