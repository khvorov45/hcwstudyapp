use crate::{
    auth,
    db::{ForeignKey, PrimaryKey, ToCurrent},
};

pub mod current;
pub mod previous;

impl PrimaryKey<String> for current::Participant {
    fn get_pk(&self) -> String {
        self.pid.clone()
    }
}

impl PrimaryKey<String> for current::User {
    fn get_pk(&self) -> String {
        self.email.clone()
    }
}

impl PrimaryKey<String> for current::Token {
    fn get_pk(&self) -> String {
        self.hash.clone()
    }
}

impl ForeignKey<String> for current::Token {
    fn get_fk(&self) -> String {
        self.user.clone()
    }
}

impl PrimaryKey<(String, u32)> for current::VaccinationHistory {
    fn get_pk(&self) -> (String, u32) {
        (self.pid.clone(), self.year)
    }
}

impl ForeignKey<String> for current::VaccinationHistory {
    fn get_fk(&self) -> String {
        self.pid.clone()
    }
}

impl PrimaryKey<(String, u32, u32)> for current::Schedule {
    fn get_pk(&self) -> (String, u32, u32) {
        (self.pid.clone(), self.year, self.day)
    }
}

impl ForeignKey<String> for current::Schedule {
    fn get_fk(&self) -> String {
        self.pid.clone()
    }
}

impl current::Token {
    pub fn new(
        email: &str,
        kind: current::TokenKind,
        len: usize,
        days_to_live: i64,
    ) -> (String, Self) {
        let before_hash = auth::random_string(len);
        let expires = match kind {
            current::TokenKind::Session => {
                Some(chrono::Utc::now() + chrono::Duration::days(days_to_live))
            }
            current::TokenKind::Api => None,
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

// ================================================================================================

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
            Other(s) => current::Occupation::Other(s.clone()),
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
            date_birth: self.date_birth,
            age_recruitment: self
                .date_birth
                .map(|dob| {
                    self.date_screening
                        .map(|date_screening| (date_screening - dob).num_days() as f64 / 365.25)
                })
                .flatten(),
            height: self.height,
            weight: self.weight,
            bmi: self.bmi,
            gender: self.gender.clone().map(|g| g.to_current()),
            occupation: self.occupation.clone().map(|o| o.to_current()),
        }
    }
}

impl ToCurrent<current::VaccinationStatus> for previous::VaccinationStatus {
    fn to_current(&self) -> current::VaccinationStatus {
        use previous::VaccinationStatus::*;
        match self {
            Australia => current::VaccinationStatus::Australia,
            Overseas => current::VaccinationStatus::Overseas,
            Unknown => current::VaccinationStatus::Unknown,
            No => current::VaccinationStatus::No,
        }
    }
}

impl ToCurrent<current::VaccinationHistory> for previous::VaccinationHistory {
    fn to_current(&self) -> current::VaccinationHistory {
        current::VaccinationHistory {
            pid: self.pid.clone(),
            year: self.year,
            status: self.status.map(|s| s.to_current()),
        }
    }
}

impl ToCurrent<current::Schedule> for previous::Schedule {
    fn to_current(&self) -> current::Schedule {
        current::Schedule {
            pid: self.pid.clone(),
            year: self.year,
            day: self.day,
            date: self.date,
        }
    }
}
