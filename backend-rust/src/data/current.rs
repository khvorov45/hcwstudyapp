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
