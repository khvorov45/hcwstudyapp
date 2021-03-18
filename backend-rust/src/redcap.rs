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

fn extract_access_group(v: &serde_json::Value) -> Option<current::AccessGroup> {
    use current::AccessGroup::*;
    use current::Site::*;
    let v = v.as_str()?;
    let v = match v {
        "" => Unrestricted,
        "sydney" => Site(Sydney),
        "melbourne" => Site(Melbourne),
        "adelaide" => Site(Adelaide),
        "perth" => Site(Perth),
        "newcastle" => Site(Newcastle),
        "brisbane" => Site(Brisbane),
        _ => return None,
    };
    Some(v)
}

fn extract_user(v: &serde_json::Value) -> Option<current::User> {
    let v = v.as_object()?;
    let user = current::User {
        email: v.get("email")?.as_str()?.to_string(),
        access_group: extract_access_group(v.get("data_access_group")?)?,
        kind: current::UserKind::Redcap,
        deidentified_export: v.get("data_export")?.as_i64()? == 2,
    };
    Some(user)
}

fn try_extract_user(v: &serde_json::Value) -> Result<current::User> {
    match extract_user(v) {
        Some(u) => Ok(u),
        None => Err(anyhow::Error::new(error::Conflict::UnexpectedRedcapData(
            v.clone(),
            "User".to_string(),
        ))),
    }
}

pub async fn export_users(opt: &Opt) -> Result<Vec<current::User>> {
    let (users2020, users2021) = redcap_api_request(opt, &[("content", "user")]).await?;
    let mut users = Vec::new();
    // Emails won't repeat in first year
    for redcap_user in users2020 {
        users.push(try_extract_user(&redcap_user)?);
    }
    // Need to check that user isn't already in for subsequent years
    for redcap_user in users2021 {
        let user = try_extract_user(&redcap_user)?;
        if !users.iter().any(|u| u.email == user.email) {
            users.push(user);
        }
    }
    Ok(users)
}
