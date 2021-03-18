use anyhow::Context;
use serde_derive::Deserialize;
use std::fs;
use std::path::PathBuf;
use structopt::StructOpt;

pub mod api;
pub mod auth;
pub mod data;
pub mod db;
pub mod email;
pub mod error;
pub mod redcap;

pub type Result<T> = anyhow::Result<T>;

#[derive(Debug, StructOpt, Deserialize)]
#[structopt(name = "backend_rust", about = "Rust backend for HCW flu study data")]
pub struct Opt {
    /// Config file path
    #[structopt(long, default_value = "hsf_config.toml")]
    #[serde(default)]
    pub config_file: PathBuf,
    /// Database root directory
    #[structopt(long, default_value = "hcwflustudy_rust_backend_data")]
    #[serde(default)]
    pub root_dir: PathBuf,
    /// Port to listen to
    #[structopt(long, default_value = "7300")]
    #[serde(default)]
    pub port: u16,
    /// Auth token length
    #[structopt(long, default_value = "30")]
    #[serde(default)]
    pub auth_token_length: usize,
    /// Auth token days to live
    #[structopt(long, default_value = "30")]
    #[serde(default)]
    pub auth_token_days_to_live: i64,
    /// Default admin email
    #[structopt(long, default_value = "admin@example.com")]
    #[serde(default)]
    pub default_admin_email: String,
    /// Email host
    #[structopt(long, default_value = "smtp.example.com")]
    #[serde(default)]
    pub email_host: String,
    /// Email account name
    #[structopt(long, default_value = "email@example.com")]
    #[serde(default)]
    pub email_username: String,
    /// Email password
    #[structopt(long, default_value = "password")]
    #[serde(default)]
    pub email_password: String,
    /// Frontend root (for access links)
    #[structopt(long, default_value = "https://reports.hcwflustudy.com")]
    #[serde(default)]
    pub frontend_root: String,
    /// Redcap 2020 token
    #[structopt(long, default_value = "")]
    #[serde(default)]
    pub redcap_token_2020: String,
    /// Redcap 2021 token
    #[structopt(long, default_value = "")]
    #[serde(default)]
    pub redcap_token_2021: String,
    /// Redcap API URL
    #[structopt(long, default_value = "https://biredcap.mh.org.au/api/")]
    #[serde(default)]
    pub redcap_api_url: String,
}

impl Opt {
    pub fn read_config(&mut self) -> Result<()> {
        if !self.config_file.is_file() {
            return Ok(());
        }
        let config_file_contents = fs::read_to_string(self.config_file.as_path()).context(
            format!("Failed to read config file at: {:?}", self.config_file,),
        )?;
        let config_opts: Opt = toml::from_str(config_file_contents.as_str()).context(format!(
            "Failed to parse config file with contents: {}",
            config_file_contents,
        ))?;
        let matches = Opt::clap().get_matches();
        if matches.occurrences_of("root_dir") == 0 && config_opts.root_dir != PathBuf::default() {
            log::debug!(
                "overriding default root dir {:?} with config {:?}",
                self.root_dir,
                config_opts.root_dir
            );
            self.root_dir = config_opts.root_dir;
        }
        if matches.occurrences_of("port") == 0 && config_opts.port != u16::default() {
            log::debug!(
                "overriding default port {} with config {}",
                self.port,
                config_opts.port
            );
            self.port = config_opts.port;
        }
        if matches.occurrences_of("auth_token_length") == 0
            && config_opts.auth_token_length != usize::default()
        {
            log::debug!(
                "overriding default auth token length {} with config {}",
                self.auth_token_length,
                config_opts.auth_token_length
            );
            self.auth_token_length = config_opts.auth_token_length;
        }
        if matches.occurrences_of("auth_token_days_to_live") == 0
            && config_opts.auth_token_days_to_live != i64::default()
        {
            log::debug!(
                "overriding default auth token days to live {} with config {}",
                self.auth_token_days_to_live,
                config_opts.auth_token_days_to_live
            );
            self.auth_token_days_to_live = config_opts.auth_token_days_to_live;
        }
        if matches.occurrences_of("default_admin_email") == 0
            && config_opts.default_admin_email != String::default()
        {
            log::debug!(
                "overriding default admin email {} with config {}",
                self.default_admin_email,
                config_opts.default_admin_email
            );
            self.default_admin_email = config_opts.default_admin_email;
        }
        if matches.occurrences_of("email_host") == 0 && config_opts.email_host != String::default()
        {
            log::debug!(
                "overriding default email host {} with config {}",
                self.email_host,
                config_opts.email_host
            );
            self.email_host = config_opts.email_host;
        }
        if matches.occurrences_of("email_username") == 0
            && config_opts.email_username != String::default()
        {
            log::debug!(
                "overriding default email username {} with config {}",
                self.email_username,
                config_opts.email_username
            );
            self.email_username = config_opts.email_username;
        }
        if matches.occurrences_of("email_password") == 0
            && config_opts.email_password != String::default()
        {
            log::debug!(
                "overriding default email password {} with config's",
                self.email_password,
            );
            self.email_password = config_opts.email_password;
        }
        if matches.occurrences_of("frontend_root") == 0
            && config_opts.frontend_root != String::default()
        {
            log::debug!(
                "overriding default frontend root {} with config {}",
                self.frontend_root,
                config_opts.frontend_root
            );
            self.frontend_root = config_opts.frontend_root;
        }
        if matches.occurrences_of("redcap_token_2020") == 0
            && config_opts.redcap_token_2020 != String::default()
        {
            log::debug!(
                "overriding default redcap token 2020 {} with config's",
                self.redcap_token_2020,
            );
            self.redcap_token_2020 = config_opts.redcap_token_2020;
        }
        if matches.occurrences_of("redcap_token_2021") == 0
            && config_opts.redcap_token_2021 != String::default()
        {
            log::debug!(
                "overriding default redcap token 2021 {} with config's",
                self.redcap_token_2021,
            );
            self.redcap_token_2021 = config_opts.redcap_token_2021;
        }
        Ok(())
    }
}
