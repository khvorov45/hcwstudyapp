use anyhow::Context;
use serde_derive::Deserialize;
use std::fs;
use std::path::PathBuf;

pub mod api;
pub mod auth;
pub mod data;
pub mod db;
pub mod email;
pub mod error;
pub mod redcap;

pub type Result<T> = anyhow::Result<T>;

#[derive(Debug, Deserialize)]
pub struct Opt {
    /// Database root directory
    pub root_dir: PathBuf,
    /// Port to listen to
    pub port: u16,
    /// Auth token length
    pub auth_token_length: usize,
    /// Auth token days to live
    pub auth_token_days_to_live: i64,
    /// Default admin email
    pub default_admin_email: String,
    /// Email host
    pub email_host: String,
    /// Email account name
    pub email_username: String,
    /// Email password
    pub email_password: String,
    /// Frontend root (for access links)
    pub frontend_root: String,
    /// Redcap 2020 token
    pub redcap_token_2020: String,
    /// Redcap 2021 token
    pub redcap_token_2021: String,
    /// Redcap API URL
    pub redcap_api_url: String,
}

impl Opt {
    pub fn new() -> Result<Self> {
        let config_file_contents = fs::read_to_string("hsf_config.toml")
            .context("Failed to read config file (hsf_config.toml)")?;
        let config_opts: Opt = toml::from_str(config_file_contents.as_str()).context(format!(
            "Failed to parse config file with contents: {}",
            config_file_contents,
        ))?;
        Ok(config_opts)
    }
}
