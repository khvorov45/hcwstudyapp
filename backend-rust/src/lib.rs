use anyhow::Context;
use serde_derive::Deserialize;
use std::fs;
use std::path::PathBuf;
use structopt::StructOpt;

pub mod api;
pub mod auth;
pub mod data;
pub mod db;
pub mod error;

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
        Ok(())
    }
}
