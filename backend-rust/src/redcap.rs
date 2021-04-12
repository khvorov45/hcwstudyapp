use crate::{data::current, error, Opt, Result};

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

    Ok((res2020?, res2021?))
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ExpectedJson {
    String,
    StringOrNull,
    Integer,
    Real,
    RealOrNull,
    Date,
    DateOrNull,
    Object,
    Site,
    AccessGroup,
    Pid,
    Gender,
    GenderOrNull,
    Occupation,
    OccupationOrNull,
    User,
    Participant,
}

trait TryGet {
    fn try_get(&self, name: &str) -> Result<&serde_json::Value>;
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
}

trait TryAs {
    fn error(&self, expected: ExpectedJson) -> anyhow::Error;
    fn try_as_object(&self) -> Result<&serde_json::Map<String, serde_json::Value>>;
    fn try_as_str(&self) -> Result<&str>;
    fn try_as_str_or_null(&self) -> Result<Option<&str>>;
    fn try_as_i64(&self) -> Result<i64>;
    fn try_as_f64(&self) -> Result<f64>;
    fn try_as_f64_or_null(&self) -> Result<Option<f64>>;
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
    let mut participants = Vec::new();
    struct Counts {
        empty_pid: (i32, i32),
        parsed: (i32, i32),
        added: (i32, i32),
    }
    let mut counts = Counts {
        empty_pid: (0, 0),
        parsed: (0, 0),
        added: (0, 0),
    };
    fn handle_error(e: anyhow::Error, redcap_participant: &serde_json::Value) -> i32 {
        fn log_full_error(e: String, redcap_participant: &serde_json::Value) {
            log::error!(
                "Failed to parse participant: {}, at\n{}",
                e,
                serde_json::to_string_pretty(redcap_participant)
                    .unwrap_or_else(|_| "could not print particpant".to_string())
            )
        }
        fn log_pid_error(pid: &serde_json::Value) {
            log::error!("Failed to parse pid: {}", pid);
        }
        let mut empty_pid_count = 0;
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
                    log_full_error(e.to_string(), &redcap_participant);
                }
            } else {
                log_full_error(e.to_string(), &redcap_participant);
            }
        } else {
            log_full_error(e.to_string(), &redcap_participant);
        }
        empty_pid_count
    }
    for redcap_participant in participants2020 {
        match redcap_participant.try_as_participant() {
            Ok(p) => {
                counts.parsed.0 += 1;
                counts.added.0 += 1;
                participants.push(p)
            }
            Err(e) => counts.empty_pid.0 += handle_error(e, &redcap_participant),
        }
    }
    for redcap_participant in participants2021 {
        let participant = match redcap_participant.try_as_participant() {
            Ok(p) => {
                counts.parsed.1 += 1;
                p
            }
            Err(e) => {
                counts.empty_pid.1 += handle_error(e, &redcap_participant);
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
    fn log_count(msg: &str, c: (i32, i32)) {
        log::info!("Participants {}: {} (2020), {} (2021)", msg, c.0, c.1);
    }
    log_count("with empty pid", counts.empty_pid);
    log_count("parsed", counts.parsed);
    log_count("added", counts.added);
    Ok(participants)
}
