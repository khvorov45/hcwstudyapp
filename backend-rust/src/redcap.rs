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
    fn error(&self, expected: &str) -> anyhow::Error;
    fn try_as_object(&self) -> Result<&serde_json::Map<String, serde_json::Value>>;
    fn try_as_str(&self) -> Result<&str>;
    fn try_as_str_or_null(&self) -> Result<Option<&str>>;
    fn try_as_i64(&self) -> Result<i64>;
    fn try_as_date(&self) -> Result<chrono::DateTime<chrono::Utc>>;
    fn try_as_date_or_null(&self) -> Result<Option<chrono::DateTime<chrono::Utc>>>;
    fn try_as_site(&self) -> Result<current::Site>;
    fn try_as_access_group(&self) -> Result<current::AccessGroup>;
    fn try_as_user(&self) -> Result<current::User>;
    fn try_as_participant(&self) -> Result<current::Participant>;
}

impl TryAs for serde_json::Value {
    fn error(&self, expected: &str) -> anyhow::Error {
        anyhow::Error::new(error::RedcapExtraction::UnexpectedJsonValue(
            expected.to_string(),
            self.clone(),
        ))
    }
    fn try_as_object(&self) -> Result<&serde_json::Map<String, serde_json::Value>> {
        match self.as_object() {
            Some(v) => Ok(v),
            None => Err(self.error("object")),
        }
    }
    fn try_as_str(&self) -> Result<&str> {
        match self.as_str() {
            Some(v) => Ok(v),
            None => Err(self.error("string")),
        }
    }
    fn try_as_str_or_null(&self) -> Result<Option<&str>> {
        match self.as_str() {
            Some(v) => Ok(Some(v)),
            None => match self.as_null() {
                Some(()) => Ok(None),
                None => Err(self.error("string | null")),
            },
        }
    }
    fn try_as_i64(&self) -> Result<i64> {
        match self.as_i64() {
            Some(v) => Ok(v),
            None => Err(self.error("integer")),
        }
    }
    fn try_as_date(&self) -> Result<chrono::DateTime<chrono::Utc>> {
        let date = serde_json::from_value(self.clone())?;
        Ok(date)
    }
    fn try_as_date_or_null(&self) -> Result<Option<chrono::DateTime<chrono::Utc>>> {
        match self.try_as_date() {
            Ok(d) => Ok(Some(d)),
            Err(_) => match self.as_null() {
                Some(()) => Ok(None),
                None => Err(self.error("date | null")),
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
            _ => return Err(self.error("Site")),
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
    fn try_as_participant(&self) -> Result<current::Participant> {
        let v = self.try_as_object()?;
        let participant = current::Participant {
            pid: v.try_get("pid")?.try_as_str()?.to_string(),
            site: v.try_get("redcap_data_access_group")?.try_as_site()?,
            email: v
                .try_get("email")?
                .try_as_str_or_null()?
                .map(|s| s.to_string()),
            mobile: v
                .try_get("mobile_number")?
                .try_as_str_or_null()?
                .map(|s| s.to_string()),
            date_screening: v.try_get("date_screening")?.try_as_date_or_null()?,
        };
        Ok(participant)
    }
}

pub async fn export_users(opt: &Opt) -> Result<Vec<current::User>> {
    let (users2020, users2021) = redcap_api_request(opt, &[("content", "user")]).await?;
    let mut users = Vec::new();
    // Emails won't repeat in first year
    for redcap_user in users2020 {
        users.push(redcap_user.try_as_user()?);
    }
    // Need to check that user isn't already in for subsequent years
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
    for redcap_participant in participants2020 {
        participants.push(redcap_participant.try_as_participant()?);
    }
    for redcap_participant in participants2021 {
        let participant = redcap_participant.try_as_participant()?;
        if !participants.iter().any(|p| p.pid == participant.pid) {
            participants.push(participant);
        }
        // TODO
        // Handle the case when a participant is present in the subsequent year
        // but their info is (potentially) different
    }
    Ok(participants)
}
