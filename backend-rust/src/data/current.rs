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

#[derive(Serialize, Deserialize, Clone, Debug, Copy)]
pub enum Gender {
    Female,
    Male,
    Other,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Occupation {
    Nursing,
    Medical,
    Administrative,
    AlliedHealth,
    Laboratory,
    Ancillary,
    Research,
    Other(String),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Participant {
    pub pid: String,
    pub site: Site,
    pub email: Option<String>,
    pub mobile: Option<String>,
    pub date_screening: Option<DateTime<Utc>>,
    pub date_birth: Option<DateTime<Utc>>,
    pub age_recruitment: Option<f64>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub bmi: Option<f64>,
    pub gender: Option<Gender>,
    pub occupation: Option<Occupation>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Copy)]
pub enum VaccinationStatus {
    Australia,
    Overseas,
    Unknown,
    No,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaccinationHistory {
    pub pid: String,
    pub year: u32,
    pub status: Option<VaccinationStatus>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Schedule {
    pub pid: String,
    pub year: u32,
    pub day: u32,
    pub date: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum SwabResult {
    InfluenzaAUnsubtyped,
    InfluenzaAh3,
    InfluenzaAh1,
    InfluenzaBNoLineage,
    InfluenzaBVic,
    InfluenzaBYam,
    InfluenzaC,
    Parainfluenza,
    HumanMetapneumovirus,
    Picornavirus,
    Adenovirus,
    CoronavirusSars,
    CoronavirusSarsCoV2,
    Other(String),
    Negative,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WeeklySurvey {
    pub pid: String,
    pub year: u32,
    pub index: u32,
    pub date: Option<DateTime<Utc>>,
    pub ari: Option<bool>,
    pub swab_collection: Option<bool>,
    pub swab_result: Vec<SwabResult>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Withdrawn {
    pub pid: String,
    pub year: u32,
    pub date: Option<DateTime<Utc>>,
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Virus {
    pub name: String,
    pub short_name: String,
    pub clade: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Serology {
    pub pid: String,
    pub year: u32,
    pub day: u32,
    pub virus: String,
    pub titre: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Copy, PartialEq)]
pub enum StudyGroup {
    MainOnly,
    MainAndNested,
}

#[derive(Serialize, Deserialize, Clone, Debug, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ConsentDisease {
    Flu,
    Covid,
}

#[derive(Serialize, Deserialize, Clone, Debug, Copy, PartialEq)]
pub enum ConsentForm {
    Paper,
    Electronic,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Consent {
    pub pid: String,
    pub year: u32,
    pub disease: ConsentDisease,
    pub form: ConsentForm,
    pub group: Option<StudyGroup>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct YearChange {
    pub record_id: String,
    pub year: u32,
    pub pid: Option<String>,
    pub pid_preformat: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Bleed {
    pub pid: String,
    pub year: u32,
    pub day: u32,
    pub date: Option<DateTime<Utc>>,
}
