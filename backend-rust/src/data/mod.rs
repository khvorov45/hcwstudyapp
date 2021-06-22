use crate::{
    auth,
    db::{PrimaryKey, ToCurrent},
};

pub mod current;
pub mod previous;

impl PrimaryKey for current::Participant {
    type K = String;
    fn get_pk(&self) -> Self::K {
        self.pid.clone()
    }
}

impl PrimaryKey for current::User {
    type K = String;
    fn get_pk(&self) -> Self::K {
        self.email.clone()
    }
}

impl PrimaryKey for current::Token {
    type K = String;
    fn get_pk(&self) -> Self::K {
        self.hash.clone()
    }
}

impl PrimaryKey for current::VaccinationHistory {
    type K = (String, u32);
    fn get_pk(&self) -> Self::K {
        (self.pid.clone(), self.year)
    }
}

impl PrimaryKey for current::Schedule {
    type K = (String, u32, u32);
    fn get_pk(&self) -> Self::K {
        (self.pid.clone(), self.year, self.day)
    }
}

impl PrimaryKey for current::WeeklySurvey {
    type K = (String, u32, u32);
    fn get_pk(&self) -> Self::K {
        (self.pid.clone(), self.year, self.index)
    }
}

impl PrimaryKey for current::Withdrawn {
    type K = String;
    fn get_pk(&self) -> Self::K {
        self.pid.clone()
    }
}

impl PrimaryKey for current::Virus {
    type K = String;
    fn get_pk(&self) -> Self::K {
        self.name.clone()
    }
}

impl PrimaryKey for current::Serology {
    type K = (String, u32, u32, String);
    fn get_pk(&self) -> Self::K {
        (self.pid.clone(), self.year, self.day, self.virus.clone())
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
            gender: self.gender.map(|g| g.to_current()),
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

impl ToCurrent<current::SwabResult> for previous::SwabResult {
    fn to_current(&self) -> current::SwabResult {
        use previous::SwabResult::*;
        match self {
            InfluenzaAUnsubtyped => current::SwabResult::InfluenzaAUnsubtyped,
            InfluenzaAh3 => current::SwabResult::InfluenzaAh3,
            InfluenzaAh1 => current::SwabResult::InfluenzaAh1,
            InfluenzaBNoLineage => current::SwabResult::InfluenzaBNoLineage,
            InfluenzaBVic => current::SwabResult::InfluenzaBVic,
            InfluenzaBYam => current::SwabResult::InfluenzaBYam,
            InfluenzaC => current::SwabResult::InfluenzaC,
            Parainfluenza => current::SwabResult::Parainfluenza,
            HumanMetapneumovirus => current::SwabResult::HumanMetapneumovirus,
            Picornavirus => current::SwabResult::Picornavirus,
            Adenovirus => current::SwabResult::Adenovirus,
            CoronavirusSars => current::SwabResult::CoronavirusSars,
            CoronavirusSarsCoV2 => current::SwabResult::CoronavirusSarsCoV2,
            Other(s) => current::SwabResult::Other(s.clone()),
            Negative => current::SwabResult::Negative,
        }
    }
}

impl ToCurrent<current::WeeklySurvey> for previous::WeeklySurvey {
    fn to_current(&self) -> current::WeeklySurvey {
        current::WeeklySurvey {
            pid: self.pid.clone(),
            year: self.year,
            index: self.index,
            date: self.date,
            ari: self.ari,
            swab_collection: self.swab_collection,
            swab_result: self
                .swab_result
                .clone()
                .iter()
                .map(|r| r.to_current())
                .collect(),
        }
    }
}

impl ToCurrent<current::Withdrawn> for previous::Withdrawn {
    fn to_current(&self) -> current::Withdrawn {
        current::Withdrawn {
            pid: self.pid.clone(),
            date: self.date,
            reason: self.reason.clone(),
        }
    }
}

impl ToCurrent<current::Virus> for previous::Virus {
    fn to_current(&self) -> current::Virus {
        current::Virus {
            name: self.name.clone(),
            short_name: self.short_name.clone(),
            clade: self.clade.clone(),
        }
    }
}

impl ToCurrent<current::Serology> for previous::Serology {
    fn to_current(&self) -> current::Serology {
        current::Serology {
            pid: self.pid.clone(),
            year: self.year,
            day: self.day,
            virus: self.virus.clone(),
            titre: self.titre,
        }
    }
}

impl ToCurrent<current::StudyGroup> for previous::StudyGroup {
    fn to_current(&self) -> current::StudyGroup {
        match self {
            previous::StudyGroup::MainOnly => current::StudyGroup::MainOnly,
            previous::StudyGroup::MainAndNested => current::StudyGroup::MainAndNested,
        }
    }
}

impl ToCurrent<current::ConsentDisease> for previous::ConsentDisease {
    fn to_current(&self) -> current::ConsentDisease {
        match self {
            previous::ConsentDisease::Flu => current::ConsentDisease::Flu,
            previous::ConsentDisease::Covid => current::ConsentDisease::Covid,
        }
    }
}

impl ToCurrent<current::ConsentForm> for previous::ConsentForm {
    fn to_current(&self) -> current::ConsentForm {
        match self {
            previous::ConsentForm::Paper => current::ConsentForm::Paper,
            previous::ConsentForm::Electronic => current::ConsentForm::Electronic,
        }
    }
}

impl ToCurrent<current::Consent> for previous::Consent {
    fn to_current(&self) -> current::Consent {
        current::Consent {
            pid: self.pid.clone(),
            year: self.year,
            disease: self.disease.to_current(),
            form: self.form.to_current(),
            group: self.group.map(|d| d.to_current()),
        }
    }
}

impl ToCurrent<current::YearChange> for previous::YearChange {
    fn to_current(&self) -> current::YearChange {
        current::YearChange {
            record_id: self.record_id.clone(),
            year: self.year,
            pid: self.pid.clone(),
            pid_preformat: self.pid_preformat.clone(),
        }
    }
}
