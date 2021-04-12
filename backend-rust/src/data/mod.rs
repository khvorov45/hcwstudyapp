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
            email: self.email.to_lowercase(),
            access_group: self.access_group.to_current(),
            kind: self.kind.to_current(),
            deidentified_export: self.deidentified_export,
        }
    }
}

impl ToCurrent<current::TokenKind> for previous::TokenKind {
    fn to_current(&self) -> current::TokenKind {
        use previous::TokenKind::*;
        match self {
            Session => current::TokenKind::Session,
            Api => current::TokenKind::Api,
        }
    }
}

impl ToCurrent<current::Token> for previous::Token {
    fn to_current(&self) -> current::Token {
        current::Token {
            user: self.user.to_lowercase(),
            hash: self.hash.clone(),
            kind: self.kind.to_current(),
            expires: self.expires,
        }
    }
}

impl ToCurrent<current::Gender> for previous::Gender {
    fn to_current(&self) -> current::Gender {
        use previous::Gender::*;
        match self {
            Female => current::Gender::Female,
            Male => current::Gender::Male,
            Other => current::Gender::Other,
        }
    }
}

impl ToCurrent<current::Occupation> for previous::Occupation {
    fn to_current(&self) -> current::Occupation {
        use previous::Occupation::*;
        match self {
            Nursing => current::Occupation::Nursing,
            Medical => current::Occupation::Medical,
            Administrative => current::Occupation::Administrative,
            AlliedHealth => current::Occupation::AlliedHealth,
            Laboratory => current::Occupation::Laboratory,
            Ancillary => current::Occupation::Ancillary,
            Research => current::Occupation::Research,
            Other => current::Occupation::Other,
        }
    }
}

impl ToCurrent<current::Participant> for previous::Participant {
    fn to_current(&self) -> current::Participant {
        current::Participant {
            pid: self.pid.clone(),
            site: self.site.to_current(),
            email: self.email.clone(),
            mobile: self.mobile.clone(),
            date_screening: self.date_screening,
            date_birth: None,
        }
    }
}
