use crate::{data::current, db::PrimaryKey, error, Opt, Result};
use std::collections::HashMap;

async fn redcap_api_request(
    opt: &Opt,
    params: &[(&str, &str)],
) -> Result<(Vec<serde_json::Value>, Vec<serde_json::Value>)> {
    let client = reqwest::Client::new();
    let params2020 = &[
        params,
        &[
            ("token", opt.redcap_token_2020.as_str()),
            ("format", "json"),
        ],
    ]
    .concat();
    let params2021 = &[
        params,
        &[
            ("token", opt.redcap_token_2021.as_str()),
            ("format", "json"),
        ],
    ]
    .concat();

    let now = chrono::Utc::now();
    let (res2020, res2021) = tokio::join!(
        client
            .post(opt.redcap_api_url.as_str())
            .form(params2020)
            .send(),
        client
            .post(opt.redcap_api_url.as_str())
            .form(params2021)
            .send()
    );

    let (res2020, res2021) = tokio::join!(
        res2020?.json::<Vec<serde_json::Value>>(),
        res2021?.json::<Vec<serde_json::Value>>(),
    );

    log_time_elapsed("Redcap responded", now);

    Ok((res2020?, res2021?))
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ExpectedJson {
    String,
    StringOrNull,
    Integer,
    Real,
    RealOrNull,
    Boolean,
    BooleanOrNull,
    Date,
    DateOrNull,
    Object,
    Array,
    Site,
    AccessGroup,
    Pid,
    Gender,
    GenderOrNull,
    Occupation,
    OccupationOrNull,
    User,
    Participant,
    VaccinationStatus,
    VaccinationStatusOrNull,
    VaccinationHistory,
    Schedule,
    SwabResult,
    WeeklySurvey,
}

trait TryGet {
    fn try_get(&self, name: &str) -> Result<&serde_json::Value>;
    fn try_as_swab_results(&self) -> Result<Vec<current::SwabResult>>;
}

impl TryGet for serde_json::Map<String, serde_json::Value> {
    fn try_get(&self, name: &str) -> Result<&serde_json::Value> {
        match self.get(name) {
            Some(v) => Ok(v),
            None => Err(anyhow::Error::new(error::RedcapExtraction::FieldNotFound(
                name.to_string(),
            ))),
        }
    }
    fn try_as_swab_results(&self) -> Result<Vec<current::SwabResult>> {
        use current::SwabResult::*;
        let map = vec![
            (1, InfluenzaAh1),
            (2, InfluenzaAh3),
            (3, InfluenzaAh1),
            (4, InfluenzaBNoLineage),
            (5, InfluenzaBVic),
            (6, InfluenzaBYam),
            (7, InfluenzaC),
            (8, Parainfluenza),
            (9, HumanMetapneumovirus),
            (10, Picornavirus),
            (11, Adenovirus),
            (12, CoronavirusSars),
            (13, CoronavirusSarsCoV2),
            (
                14,
                Other(self.try_get("swab_other")?.try_as_str()?.to_string()),
            ),
            (15, Negative),
        ];
        let mut res = Vec::with_capacity(map.len());
        for (i, swab_result) in map {
            let var_name = format!("swab_result___{}", i);
            if self.try_get(var_name.as_str())?.try_as_str()? == "1" {
                res.push(swab_result)
            }
        }
        Ok(res)
    }
}

trait TryAs {
    fn error(&self, expected: ExpectedJson) -> anyhow::Error;
    fn try_as_object(&self) -> Result<&serde_json::Map<String, serde_json::Value>>;
    fn try_as_array(&self) -> Result<Vec<serde_json::Value>>;
    fn try_as_str(&self) -> Result<&str>;
    fn try_as_str_or_null(&self) -> Result<Option<&str>>;
    fn try_as_i64(&self) -> Result<i64>;
    fn try_as_f64(&self) -> Result<f64>;
    fn try_as_f64_or_null(&self) -> Result<Option<f64>>;
    fn try_as_bool(&self) -> Result<bool>;
    fn try_as_bool_or_null(&self) -> Result<Option<bool>>;
    fn try_as_date(&self) -> Result<chrono::DateTime<chrono::Utc>>;
    fn try_as_date_or_null(&self) -> Result<Option<chrono::DateTime<chrono::Utc>>>;
    fn try_as_site(&self) -> Result<current::Site>;
    fn try_as_access_group(&self) -> Result<current::AccessGroup>;
    fn try_as_user(&self) -> Result<current::User>;
    fn try_as_pid(&self) -> Result<String>;
    fn try_as_gender(&self) -> Result<current::Gender>;
    fn try_as_gender_or_null(&self) -> Result<Option<current::Gender>>;
    fn try_as_occupation(&self, other: &serde_json::Value) -> Result<current::Occupation>;
    fn try_as_occupation_or_null(
        &self,
        other: &serde_json::Value,
    ) -> Result<Option<current::Occupation>>;
    fn try_as_participant(&self) -> Result<current::Participant>;
    fn try_as_vaccination_status(&self) -> Result<current::VaccinationStatus>;
    fn try_as_vaccination_status_or_null(&self) -> Result<Option<current::VaccinationStatus>>;
    fn try_as_vaccination_history(
        &self,
        year: u32,
        var_name: &str,
    ) -> Result<current::VaccinationHistory>;
    fn try_as_schedule(&self, year: u32, day: u32, var_name: &str) -> Result<current::Schedule>;
    fn try_as_swab_result(&self) -> Result<current::SwabResult>;
    fn try_as_weekly_survey(&self, pid_map: &str, year: u32) -> Result<current::WeeklySurvey>;
}

impl TryAs for serde_json::Value {
    fn error(&self, expected: ExpectedJson) -> anyhow::Error {
        anyhow::Error::new(error::RedcapExtraction::UnexpectedJsonValue(
            expected,
            self.clone(),
        ))
    }
    fn try_as_object(&self) -> Result<&serde_json::Map<String, serde_json::Value>> {
        match self.as_object() {
            Some(v) => Ok(v),
            None => Err(self.error(ExpectedJson::Object)),
        }
    }
    fn try_as_array(&self) -> Result<Vec<serde_json::Value>> {
        match self.as_array() {
            Some(v) => Ok(v.to_vec()),
            None => Err(self.error(ExpectedJson::Array)),
        }
    }
    fn try_as_str(&self) -> Result<&str> {
        match self.as_str() {
            Some(v) => Ok(v),
            None => Err(self.error(ExpectedJson::String)),
        }
    }
    fn try_as_str_or_null(&self) -> Result<Option<&str>> {
        match self.as_str() {
            Some(v) => Ok(Some(v)),
            None => match self.as_null() {
                Some(()) => Ok(None),
                None => match self.as_str() {
                    Some(s) if s.is_empty() => Ok(None),
                    _ => Err(self.error(ExpectedJson::StringOrNull)),
                },
            },
        }
    }
    fn try_as_i64(&self) -> Result<i64> {
        match self.as_i64() {
            Some(v) => Ok(v),
            None => Err(self.error(ExpectedJson::Integer)),
        }
    }
    fn try_as_f64(&self) -> Result<f64> {
        match self.as_f64() {
            Some(v) => Ok(v),
            None => match self.as_str() {
                Some(v) => match v.parse() {
                    Ok(v) => Ok(v),
                    Err(_) => Err(self.error(ExpectedJson::Real)),
                },
                None => Err(self.error(ExpectedJson::Real)),
            },
        }
    }
    fn try_as_f64_or_null(&self) -> Result<Option<f64>> {
        match self.try_as_f64() {
            Ok(v) => Ok(Some(v)),
            Err(_) => match self.as_null() {
                Some(()) => Ok(None),
                None => match self.as_str() {
                    Some(v) if v.is_empty() => Ok(None),
                    _ => Err(self.error(ExpectedJson::RealOrNull)),
                },
            },
        }
    }
    fn try_as_bool(&self) -> Result<bool> {
        match self.as_bool() {
            Some(v) => Ok(v),
            None => match self.as_str() {
                Some(v) => match v.parse() {
                    Ok(v) => Ok(v),
                    Err(_) => match v {
                        "1" => Ok(true),
                        "0" => Ok(false),
                        _ => Err(self.error(ExpectedJson::Boolean)),
                    },
                },
                None => Err(self.error(ExpectedJson::Boolean)),
            },
        }
    }
    fn try_as_bool_or_null(&self) -> Result<Option<bool>> {
        match self.try_as_bool() {
            Ok(v) => Ok(Some(v)),
            Err(_) => match self.as_null() {
                Some(()) => Ok(None),
                None => match self.as_str() {
                    Some(v) if v.is_empty() => Ok(None),
                    _ => Err(self.error(ExpectedJson::BooleanOrNull)),
                },
            },
        }
    }
    fn try_as_date(&self) -> Result<chrono::DateTime<chrono::Utc>> {
        let date: chrono::NaiveDate = serde_json::from_value(self.clone())?;
        let datetime = date.and_time(chrono::NaiveTime::from_hms(0, 0, 0));
        let datetime_tz = chrono::DateTime::from_utc(datetime, chrono::Utc);
        Ok(datetime_tz)
    }
    fn try_as_date_or_null(&self) -> Result<Option<chrono::DateTime<chrono::Utc>>> {
        match self.try_as_date() {
            Ok(d) => Ok(Some(d)),
            Err(_) => match self.as_null() {
                Some(()) => Ok(None),
                None => match self.as_str() {
                    Some(s) if s.is_empty() => Ok(None),
                    _ => Err(self.error(ExpectedJson::DateOrNull)),
                },
            },
        }
    }
    fn try_as_site(&self) -> Result<current::Site> {
        use current::Site::*;
        let v = match self.try_as_str()? {
            "sydney" => Sydney,
            "melbourne" => Melbourne,
            "adelaide" => Adelaide,
            "perth" => Perth,
            "newcastle" => Newcastle,
            "brisbane" => Brisbane,
            _ => return Err(self.error(ExpectedJson::Site)),
        };
        Ok(v)
    }
    fn try_as_access_group(&self) -> Result<current::AccessGroup> {
        use current::AccessGroup::*;
        let v = match self.try_as_str()? {
            "" => Unrestricted,
            _ => Site(self.try_as_site()?),
        };
        Ok(v)
    }
    fn try_as_user(&self) -> Result<current::User> {
        let v = self.try_as_object()?;
        let user = current::User {
            email: v.try_get("email")?.try_as_str()?.to_lowercase(),
            access_group: v.try_get("data_access_group")?.try_as_access_group()?,
            kind: current::UserKind::Redcap,
            deidentified_export: v.try_get("data_export")?.try_as_i64()? == 2,
        };
        Ok(user)
    }
    /// The expected format is XXX-DDD-XXX-DDD where X is a letter and D is a digit.
    /// The dash is optional, the letters and numbers after the first pair are also optional.
    fn try_as_pid(&self) -> Result<String> {
        let mut pid = String::new();
        let itr = self.try_as_str()?.chars();
        #[derive(PartialEq)]
        enum State {
            First,
            Transition,
            Second,
        }
        let mut state = State::First;
        for c in itr {
            match &state {
                State::First => {
                    if c.is_alphabetic() {
                        pid.push(c);
                    } else {
                        pid.push('-');
                        if c.is_digit(10) {
                            pid.push(c);
                        }
                        state = State::Transition;
                    }
                }
                State::Transition => {
                    if c.is_digit(10) {
                        pid.push(c);
                        state = State::Second
                    } else {
                        continue;
                    }
                }
                State::Second => {
                    if c.is_digit(10) {
                        pid.push(c);
                    } else {
                        break;
                    }
                }
            }
        }
        if state != State::Second {
            return Err(self.error(ExpectedJson::Pid));
        }
        Ok(pid.to_uppercase())
    }
    fn try_as_gender(&self) -> Result<current::Gender> {
        match self.as_str() {
            Some(v) => match v {
                "0" => Ok(current::Gender::Female),
                "1" => Ok(current::Gender::Male),
                "2" => Ok(current::Gender::Other),
                _ => Err(self.error(ExpectedJson::Gender)),
            },
            None => Err(self.error(ExpectedJson::Gender)),
        }
    }
    fn try_as_gender_or_null(&self) -> Result<Option<current::Gender>> {
        match self.try_as_gender() {
            Ok(v) => Ok(Some(v)),
            Err(_) => match self.as_null() {
                Some(()) => Ok(None),
                None => match self.as_str() {
                    Some(v) if v.is_empty() => Ok(None),
                    _ => Err(self.error(ExpectedJson::GenderOrNull)),
                },
            },
        }
    }
    fn try_as_occupation(&self, other: &serde_json::Value) -> Result<current::Occupation> {
        match self.as_str() {
            Some(v) => match v {
                "1" => Ok(current::Occupation::Medical),
                "2" => Ok(current::Occupation::Nursing),
                "3" => Ok(current::Occupation::AlliedHealth),
                "4" => Ok(current::Occupation::Laboratory),
                "5" => Ok(current::Occupation::Administrative),
                "6" => Ok(current::Occupation::Ancillary),
                "8" => Ok(current::Occupation::Research),
                "7" => match other.as_str() {
                    Some(v) if !v.is_empty() => Ok(current::Occupation::Other(v.to_string())),
                    Some(_) => Ok(current::Occupation::Other("other".to_string())),
                    None => Err(self.error(ExpectedJson::Occupation)),
                },
                _ => Err(self.error(ExpectedJson::Occupation)),
            },
            None => Err(self.error(ExpectedJson::Occupation)),
        }
    }
    fn try_as_occupation_or_null(
        &self,
        other: &serde_json::Value,
    ) -> Result<Option<current::Occupation>> {
        match self.try_as_occupation(other) {
            Ok(v) => Ok(Some(v)),
            Err(_) => match self.as_null() {
                Some(()) => Ok(None),
                None => match self.as_str() {
                    Some(v) if v.is_empty() => Ok(None),
                    _ => Err(self.error(ExpectedJson::OccupationOrNull)),
                },
            },
        }
    }
    fn try_as_participant(&self) -> Result<current::Participant> {
        let v = self.try_as_object()?;
        let date_birth = v.try_get("a2_dob")?.try_as_date_or_null()?;
        let date_screening = v.try_get("date_screening")?.try_as_date_or_null()?;
        let height = v.try_get("a5_height")?.try_as_f64_or_null()?;
        let weight = v.try_get("a6_weight")?.try_as_f64_or_null()?;
        let participant = current::Participant {
            pid: v.try_get("pid")?.try_as_pid()?,
            site: v.try_get("redcap_data_access_group")?.try_as_site()?,
            email: v
                .try_get("email")?
                .try_as_str_or_null()?
                .map(|s| s.to_string()),
            mobile: v
                .try_get("mobile_number")?
                .try_as_str_or_null()?
                .map(|s| s.to_string()),
            date_screening,
            date_birth,
            age_recruitment: date_birth
                .map(|date_birth| {
                    date_screening.map(|date_screening| {
                        (date_screening - date_birth).num_days() as f64 / 365.25
                    })
                })
                .flatten(),
            height,
            weight,
            bmi: height
                .map(|height| weight.map(|weight| weight / (height * height / 10000f64)))
                .flatten(),
            gender: v.try_get("a1_gender")?.try_as_gender_or_null()?,
            occupation: v
                .try_get("c3_occupation")?
                .try_as_occupation_or_null(v.try_get("c3_spec")?)?,
        };
        Ok(participant)
    }
    fn try_as_vaccination_status(&self) -> Result<current::VaccinationStatus> {
        use current::VaccinationStatus::*;
        let v = match self.try_as_str()? {
            "1" => Australia,
            "2" => Overseas,
            "3" => No,
            "4" => Unknown,
            _ => return Err(self.error(ExpectedJson::VaccinationStatus)),
        };
        Ok(v)
    }
    fn try_as_vaccination_status_or_null(&self) -> Result<Option<current::VaccinationStatus>> {
        match self.try_as_vaccination_status() {
            Ok(v) => Ok(Some(v)),
            Err(_) => match self.as_null() {
                Some(()) => Ok(None),
                None => match self.as_str() {
                    Some(v) if v.is_empty() => Ok(None),
                    _ => Err(self.error(ExpectedJson::VaccinationStatusOrNull)),
                },
            },
        }
    }
    fn try_as_vaccination_history(
        &self,
        year: u32,
        var_name: &str,
    ) -> Result<current::VaccinationHistory> {
        let v = self.try_as_object()?;
        let vac = current::VaccinationHistory {
            pid: v.try_get("pid")?.try_as_pid()?,
            year,
            status: v.try_get(var_name)?.try_as_vaccination_status_or_null()?,
        };
        Ok(vac)
    }
    fn try_as_schedule(&self, year: u32, day: u32, var_name: &str) -> Result<current::Schedule> {
        let v = self.try_as_object()?;
        let schedule = current::Schedule {
            pid: v.try_get("pid")?.try_as_pid()?,
            year,
            day,
            date: v.try_get(var_name)?.try_as_date_or_null()?,
        };
        Ok(schedule)
    }
    fn try_as_swab_result(&self) -> Result<current::SwabResult> {
        let res = match self.try_as_str()? {
            "a" => current::SwabResult::Adenovirus,
            _ => return Err(self.error(ExpectedJson::SwabResult)),
        };
        Ok(res)
    }
    fn try_as_weekly_survey(&self, pid: &str, year: u32) -> Result<current::WeeklySurvey> {
        let v = self.try_as_object()?;
        let weekly_survey = current::WeeklySurvey {
            pid: pid.to_string(),
            year,
            index: v
                .try_get("redcap_event_name")?
                .try_as_str()?
                .replace("weekly_survey_", "")
                .replace("_arm_1", "")
                .parse()?,
            ari: v.try_get("ari_definition")?.try_as_bool_or_null()?,
            date: v.try_get("date_symptom_survey")?.try_as_date_or_null()?,
            swab_collection: v.try_get("swab_collection")?.try_as_bool_or_null()?,
            swab_result: v.try_as_swab_results()?,
        };
        Ok(weekly_survey)
    }
}

pub async fn export_users(opt: &Opt) -> Result<Vec<current::User>> {
    let (users2020, users2021) = redcap_api_request(opt, &[("content", "user")]).await?;
    let mut users = Vec::new();
    //* Emails won't repeat in first year
    for redcap_user in users2020 {
        users.push(redcap_user.try_as_user()?);
    }
    //* Need to check that user isn't already in for subsequent years
    for redcap_user in users2021 {
        let user = redcap_user.try_as_user()?;
        if !users.iter().any(|u| u.email == user.email) {
            users.push(user);
        }
    }
    Ok(users)
}

fn log_full_error(msg: &str, e: String, value: &serde_json::Value) {
    log::error!(
        "{}: {}, at\n{}",
        msg,
        e,
        serde_json::to_string_pretty(value).unwrap_or_else(|_| format!("{:?}", value))
    )
}

fn handle_extraction_error(e: anyhow::Error, value: &serde_json::Value) -> i32 {
    fn log_pid_error(pid: &serde_json::Value) {
        log::error!("Failed to parse pid: {}", pid);
    }
    let mut empty_pid_count = 0;
    let msg = "failed to parse";
    if let Some(e) = e.downcast_ref::<error::RedcapExtraction>() {
        if let error::RedcapExtraction::UnexpectedJsonValue(expected, got) = e {
            if expected == &ExpectedJson::Pid {
                if let Some(pid) = got.as_str() {
                    if pid.is_empty() {
                        empty_pid_count += 1;
                    } else {
                        log_pid_error(got);
                    }
                } else {
                    log_pid_error(got);
                }
            } else {
                log_full_error(msg, e.to_string(), &value);
            }
        } else {
            log_full_error(msg, e.to_string(), &value);
        }
    } else {
        log_full_error(msg, e.to_string(), &value);
    }
    empty_pid_count
}

#[derive(Default)]
struct ExtractionCounts {
    empty_pid: (i32, i32),
    parsed: (i32, i32),
    added: (i32, i32),
}

impl ExtractionCounts {
    pub fn log(&self, title: &str) {
        fn log_count(title: &str, msg: &str, c: (i32, i32)) {
            log::info!("{} {}: {} (2020), {} (2021)", title, msg, c.0, c.1);
        }
        log_count(title, "with empty pid", self.empty_pid);
        log_count(title, "parsed", self.parsed);
        log_count(title, "added", self.added);
    }
}

fn log_time_elapsed(title: &str, old: chrono::DateTime<chrono::Utc>) {
    log::info!(
        "{} in {:.2}s",
        title,
        (chrono::Utc::now() - old).num_milliseconds() as f64 / 1000f64
    );
}

pub async fn export_participants(opt: &Opt) -> Result<Vec<current::Participant>> {
    let (participants2020, participants2021) = redcap_api_request(
        opt,
        &[
            ("content", "record"),
            (
                "fields",
                [
                    "pid",
                    "redcap_data_access_group",
                    "date_screening",
                    "email",
                    "mobile_number",
                    "a1_gender",
                    "a2_dob",
                    "a3_atsi",
                    "a5_height",
                    "a6_weight",
                    "c3_occupation",
                    "c3_spec",
                ]
                .join(",")
                .as_str(),
            ),
            ("events", "baseline_arm_1"),
            ("exportDataAccessGroups", "true"),
        ],
    )
    .await?;

    let now = chrono::Utc::now();

    let mut participants = Vec::new();
    let mut counts = ExtractionCounts::default();

    for redcap_participant in participants2020 {
        match redcap_participant.try_as_participant() {
            Ok(p) => {
                counts.parsed.0 += 1;
                counts.added.0 += 1;
                participants.push(p)
            }
            Err(e) => counts.empty_pid.0 += handle_extraction_error(e, &redcap_participant),
        }
    }

    for redcap_participant in participants2021 {
        let participant = match redcap_participant.try_as_participant() {
            Ok(p) => {
                counts.parsed.1 += 1;
                p
            }
            Err(e) => {
                counts.empty_pid.1 += handle_extraction_error(e, &redcap_participant);
                continue;
            }
        };
        if !participants.iter().any(|p| p.pid == participant.pid) {
            counts.added.1 += 1;
            participants.push(participant);
        }
        // TODO
        // Handle the case when a participant is present in the subsequent year
        // but their info is (potentially) different
    }
    log_time_elapsed("Participants parsed", now);
    counts.log("Participants");
    Ok(participants)
}

pub async fn export_record_id_pid_map(opt: &Opt) -> Result<HashMap<String, String>> {
    let (map2020, map2021) = redcap_api_request(
        opt,
        &[
            ("content", "record"),
            ("fields", ["pid", "record_id"].join(",").as_str()),
            ("events", "baseline_arm_1"),
        ],
    )
    .await?;

    let mut pid_map = std::collections::HashMap::<String, String>::new();

    fn add_to_pid_map(
        pid_map: &mut std::collections::HashMap<String, String>,
        v: &serde_json::Value,
    ) -> Result<u32> {
        let v = v.try_as_object()?;
        let pid = v.try_get("pid")?.try_as_str()?;
        let record_id = v.try_get("record_id")?.try_as_str()?;
        if !pid.is_empty() {
            pid_map.insert(record_id.to_string(), pid.to_string());
            Ok(1)
        } else {
            Ok(0)
        }
    }

    fn handle_pid_map_error(e: anyhow::Error, v: &serde_json::Value) {
        log::error!(
            "failed to add to pid map: {} at\n{}",
            e,
            serde_json::to_string_pretty(&v)
                .unwrap_or_else(|_| "failed to print screening vaccination".to_string())
        )
    }

    let mut parsed = 0;
    let mut added = 0;
    for redcap_vaccination in map2020.iter().chain(map2021.iter()) {
        match add_to_pid_map(&mut pid_map, &redcap_vaccination) {
            Ok(i) => {
                added += i;
                parsed += 1;
            }
            Err(e) => handle_pid_map_error(e, &redcap_vaccination),
        }
    }

    log::info!(
        "Record ID - PID map extraction: {} parsed; {} added",
        parsed,
        added,
    );

    Ok(pid_map)
}

pub async fn export_vaccination_history(
    opt: &Opt,
    pid_map: &HashMap<String, String>,
) -> Result<Vec<current::VaccinationHistory>> {
    let years = (2015u32..=2020u32).into_iter().collect::<Vec<u32>>();
    let years_var_names = years
        .iter()
        .map(|y| format!("vac_{}", y))
        .collect::<Vec<String>>();
    let screening_fields = ["pid", years_var_names.join(",").as_str()].join(",");
    let screening_params = [
        ("content", "record"),
        ("fields", screening_fields.as_str()),
        ("events", "baseline_arm_1"),
    ];
    let vaccination_fields = ["record_id", "vaccinated"].join(",");
    let vaccination_params = [
        ("content", "record"),
        ("fields", vaccination_fields.as_str()),
        ("events", "vaccination_arm_1"),
    ];
    let (redcap_screening, redcap_vaccination) = tokio::join!(
        redcap_api_request(opt, &screening_params),
        redcap_api_request(opt, &vaccination_params),
    );

    let now = chrono::Utc::now();

    let (redcap_screening_2020, redcap_screening_2021) = redcap_screening?;
    let (redcap_vaccination_2020, redcap_vaccination_2021) = redcap_vaccination?;

    let mut vaccination_history = Vec::new();
    let mut counts = ExtractionCounts::default();

    fn handle_error(e: anyhow::Error, val: &serde_json::Value, var_name: &str) -> i32 {
        if let Some(error::RedcapExtraction::FieldNotFound(field_name)) =
            e.downcast_ref::<error::RedcapExtraction>()
        {
            //* E.g. vac_2020 field in 2020 project screening form
            if field_name == var_name {
                0
            } else {
                handle_extraction_error(e, &val)
            }
        } else {
            handle_extraction_error(e, &val)
        }
    }

    for redcap_vaccination in redcap_screening_2020 {
        for (year, var_name) in years.iter().zip(years_var_names.iter()) {
            match redcap_vaccination.try_as_vaccination_history(*year, var_name) {
                Ok(v) => {
                    counts.parsed.0 += 1;
                    counts.added.0 += 1;
                    vaccination_history.push(v)
                }
                Err(e) => {
                    counts.empty_pid.0 += handle_error(e, &redcap_vaccination, var_name);
                }
            }
        }
    }

    vaccination_history.sort_by_key(|v| v.get_pk());

    for redcap_vaccination in redcap_screening_2021 {
        for (year, var_name) in years.iter().zip(years_var_names.iter()) {
            let value = match redcap_vaccination.try_as_vaccination_history(*year, var_name) {
                Ok(v) => {
                    counts.parsed.1 += 1;
                    v
                }
                Err(e) => {
                    counts.empty_pid.1 += handle_error(e, &redcap_vaccination, var_name);
                    continue;
                }
            };
            if let Err(i) =
                vaccination_history.binary_search_by_key(&value.get_pk(), |v| v.get_pk())
            {
                counts.added.1 += 1;
                vaccination_history.insert(i, value);
            }
        }
    }

    counts.log("Vaccination history");

    fn parse_redcap_vaccination(
        v: &serde_json::Value,
    ) -> Result<(String, Option<current::VaccinationStatus>)> {
        let v = v.try_as_object()?;
        let record_id = v.try_get("record_id")?.try_as_str()?.to_string();
        let status = match v.try_get("vaccinated")?.try_as_str()? {
            "1" => Some(current::VaccinationStatus::Australia),
            "0" => Some(current::VaccinationStatus::No),
            _ => None,
        };
        Ok((record_id, status))
    }

    fn handle_error_vaccination(e: anyhow::Error, v: &serde_json::Value) {
        log::error!(
            "failed to parse vaccination: {} at\n{}",
            e,
            serde_json::to_string_pretty(v)
                .unwrap_or_else(|_| "failed to print vaccination".to_string())
        );
    }

    fn add_to_vaccinations(
        vaccination_history: &mut Vec<current::VaccinationHistory>,
        redcap_vaccination_year: &[serde_json::Value],
        year: u32,
        pid_map: &std::collections::HashMap<String, String>,
    ) {
        let mut added = 0;
        let mut no_matching_pid = 0;
        let mut parsed = 0;
        for redcap_vaccination in redcap_vaccination_year {
            let (record_id, status) = match parse_redcap_vaccination(&redcap_vaccination) {
                Ok((r, s)) => {
                    parsed += 1;
                    (r, s)
                }
                Err(e) => {
                    handle_error_vaccination(e, &redcap_vaccination);
                    continue;
                }
            };
            let pid = match pid_map.get(&record_id) {
                Some(pid) => pid.clone(),
                None => {
                    no_matching_pid += 1;
                    continue;
                }
            };
            if let Err(i) =
                vaccination_history.binary_search_by_key(&(pid.clone(), year), |v| v.get_pk())
            {
                added += 1;
                let value = current::VaccinationHistory { pid, status, year };
                vaccination_history.insert(i, value);
            }
        }
        log::info!(
            "Vaccinations in {}: {} parsed, {} no matching pid, {} added",
            year,
            parsed,
            no_matching_pid,
            added
        );
    }

    add_to_vaccinations(
        &mut vaccination_history,
        &redcap_vaccination_2020,
        2020,
        &pid_map,
    );

    add_to_vaccinations(
        &mut vaccination_history,
        &redcap_vaccination_2021,
        2021,
        &pid_map,
    );

    log_time_elapsed("Vaccination history parsed", now);
    Ok(vaccination_history)
}

pub async fn export_schedule(opt: &Opt) -> Result<Vec<current::Schedule>> {
    let days: [u32; 4] = [0, 7, 14, 280];
    let var_names = days
        .iter()
        .map(|d| format!("scheduled_date_v{}", d))
        .collect::<Vec<String>>();
    let (schedule2020, schedule2021) = redcap_api_request(
        opt,
        &[
            ("content", "record"),
            (
                "fields",
                ["pid", var_names.join(",").as_str()].join(",").as_str(),
            ),
            ("events", "baseline_arm_1"),
        ],
    )
    .await?;

    let now = chrono::Utc::now();
    let mut schedule = Vec::new();
    let mut counts = ExtractionCounts::default();

    for redcap_schedule in schedule2020 {
        for (day, var_name) in days.iter().zip(var_names.iter()) {
            match redcap_schedule.try_as_schedule(2020, *day, var_name) {
                Ok(v) => {
                    counts.parsed.0 += 1;
                    counts.added.0 += 1;
                    schedule.push(v)
                }
                Err(e) => counts.empty_pid.0 += handle_extraction_error(e, &redcap_schedule),
            }
        }
    }

    for redcap_schedule in schedule2021 {
        for (day, var_name) in days.iter().zip(var_names.iter()) {
            match redcap_schedule.try_as_schedule(2021, *day, var_name) {
                Ok(v) => {
                    counts.parsed.1 += 1;
                    counts.added.1 += 1;
                    schedule.push(v);
                }
                Err(e) => counts.empty_pid.1 += handle_extraction_error(e, &redcap_schedule),
            };
        }
    }

    counts.log("Schedule");
    log_time_elapsed("Schedule parsed", now);

    Ok(schedule)
}

pub async fn export_weekly_survey(
    opt: &Opt,
    pid_map: &HashMap<String, String>,
) -> Result<Vec<current::WeeklySurvey>> {
    let survey_indices = (1u32..=52u32).collect::<Vec<u32>>();
    let survey_event_names = survey_indices
        .iter()
        .map(|i| format!("weekly_survey_{}_arm_1", i))
        .collect::<Vec<String>>();
    let (survey2020, survey2021) = redcap_api_request(
        opt,
        &[
            ("content", "record"),
            (
                "fields",
                [
                    "record_id",
                    "ari_definition",
                    "date_symptom_survey",
                    "swab_collection",
                    "swab_result",
                    "swab_other",
                    "recent_covax",
                    "covax_rec",
                    "covax_rec_other",
                    "covax_dose",
                    "covax_date",
                    "covax_batch",
                ]
                .join(",")
                .as_str(),
            ),
            ("events", survey_event_names.join(",").as_str()),
        ],
    )
    .await?;

    let now = chrono::Utc::now();
    let mut weekly_survey: Vec<current::WeeklySurvey> = Vec::new();
    let mut counts = ExtractionCounts::default();

    fn pull_record_id(v: &serde_json::Value) -> Result<String> {
        let record_id = v
            .try_as_object()?
            .try_get("record_id")?
            .try_as_str()?
            .to_string();
        Ok(record_id)
    }

    for redcap_survey in survey2020 {
        let record_id = match pull_record_id(&redcap_survey) {
            Ok(s) => s,
            Err(e) => {
                log_full_error(
                    "Failed to extract record_id from weekly survey",
                    e.to_string(),
                    &redcap_survey,
                );
                continue;
            }
        };
        let pid = match pid_map.get(&record_id) {
            Some(pid) => pid,
            None => {
                counts.empty_pid.0 += 1;
                continue;
            }
        };
        let value = match redcap_survey.try_as_weekly_survey(pid.as_str(), 2020) {
            Ok(v) => {
                counts.parsed.0 += 1;
                v
            }
            Err(e) => {
                log_full_error(
                    "Failed to parse weekly survey",
                    e.to_string(),
                    &redcap_survey,
                );
                continue;
            }
        };
        counts.added.0 += 1;
        weekly_survey.push(value);
    }

    for redcap_survey in &survey2021 {
        let record_id = match pull_record_id(&redcap_survey) {
            Ok(s) => s,
            Err(e) => {
                log_full_error(
                    "Failed to extract record_id from weekly survey",
                    e.to_string(),
                    &redcap_survey,
                );
                continue;
            }
        };
        let pid = match pid_map.get(&record_id) {
            Some(pid) => pid,
            None => {
                counts.empty_pid.1 += 1;
                continue;
            }
        };
        let value = match redcap_survey.try_as_weekly_survey(pid.as_str(), 2021) {
            Ok(v) => {
                counts.parsed.1 += 1;
                v
            }
            Err(e) => {
                log_full_error(
                    "Failed to parse weekly survey",
                    e.to_string(),
                    &redcap_survey,
                );
                continue;
            }
        };
        counts.added.1 += 1;
        weekly_survey.push(value);
    }

    counts.log("Weekly survey");
    log_time_elapsed("Weekly survey parsed", now);

    if let Err(e) = send_covid_vaccination(opt, &survey2021).await {
        log::error!("Error sending covid vaccinations: {}", e);
    }

    Ok(weekly_survey)
}

#[derive(serde_derive::Serialize)]
struct RedcapVaccinationCovid {
    record_id: String,
    redcap_event_name: String,
    covid_vac_brand: String,
    other_covax_brand: String,
    covid_vac_dose1_rec: String,
    covid_vac_dose2_rec: String,
    covid_vacc_date1: String,
    covid_vacc_date2: String,
    covid_vac_batch1: String,
    covid_vac_batch2: String,
    covid_vac_survey_index: String,
}

async fn send_covid_vaccination(opt: &Opt, data_raw: &[serde_json::Value]) -> Result<()> {
    let mut data_to_send: Vec<RedcapVaccinationCovid> = Vec::new();

    for value in data_raw {
        let v = value.try_as_object()?;
        let received = v.try_get("recent_covax")?.try_as_str()?;
        let dose = v.try_get("covax_dose")?.try_as_str()?.to_string();
        if received != "1" || (dose != "1" && dose != "2") {
            continue;
        }
        let date = v.try_get("covax_date")?.try_as_str()?.to_string();
        let batch = v.try_get("covax_batch")?.try_as_str()?.to_string();
        let v = RedcapVaccinationCovid {
            record_id: v.try_get("record_id")?.try_as_str()?.to_string(),
            redcap_event_name: "vaccination_arm_1".to_string(),
            covid_vac_brand: v.try_get("covax_rec")?.try_as_str()?.to_string(),
            other_covax_brand: v.try_get("covax_rec_other")?.try_as_str()?.to_string(),
            covid_vac_dose1_rec: if dose == "1" {
                "1".to_string()
            } else {
                "".to_string()
            },
            covid_vac_dose2_rec: if dose == "2" {
                "1".to_string()
            } else {
                "".to_string()
            },
            covid_vacc_date1: if dose == "1" {
                date.clone()
            } else {
                "".to_string()
            },
            covid_vacc_date2: if dose == "2" { date } else { "".to_string() },
            covid_vac_batch1: if dose == "1" {
                batch.clone()
            } else {
                "".to_string()
            },
            covid_vac_batch2: if dose == "2" { batch } else { "".to_string() },
            covid_vac_survey_index: v
                .try_get("redcap_event_name")?
                .try_as_str()?
                .replace("weekly_survey_", "")
                .replace("_arm_1", "")
                .to_string(),
        };
        data_to_send.push(v);
    }

    if data_to_send.is_empty() {
        log::info!("no covid vaccination information to send");
        return Ok(());
    }

    let client = reqwest::Client::new();
    let data_string = serde_json::to_string(&data_to_send)?;
    let params = &[
        ("token", opt.redcap_token_2021.as_str()),
        ("format", "json"),
        ("content", "record"),
        ("data", data_string.as_str()),
    ];
    let res = client
        .post(opt.redcap_api_url.as_str())
        .form(params)
        .send()
        .await?;
    if !res.status().is_success() {
        log::error!(
            "Error sending results, status: {}, body: {}",
            res.status(),
            res.text()
                .await
                .unwrap_or_else(|_| "failed to text body".to_string())
        );
    }
    log::info!(
        "sent {} covid vaccination info to redcap",
        data_to_send.len()
    );
    Ok(())
}
