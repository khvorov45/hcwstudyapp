use crate::{data, Result};
use anyhow::Context;
use serde::{de::DeserializeOwned, Serialize};
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};

pub struct Db {
    pub dir: PathBuf,
    pub users: Table<data::User>,
}

pub struct Table<T: Serialize + DeserializeOwned> {
    pub name: String,
    pub path: PathBuf,
    pub data: Vec<T>,
}

impl Db {
    pub fn new(dir: PathBuf) -> Result<Self> {
        // Root directory
        if !dir.is_dir() {
            fs::create_dir(dir.as_path())
                .context(format!("Failed to create db root directory at {:?}", dir))?;
        }
        // Create empty and read the data in
        let mut db = Self {
            users: Table::new("User", dir.as_path())?,
            dir,
        };
        db.read_from_disk()?;
        Ok(db)
    }
    pub fn read_from_disk(&mut self) -> Result<()> {
        log::debug!("reading db from disk");
        self.users.read()?;
        Ok(())
    }
    pub fn write_to_disk(&self) -> Result<()> {
        log::debug!("writing db to disk");
        self.users.write()?;
        Ok(())
    }
}

impl<T: Serialize + DeserializeOwned> Table<T> {
    pub fn new<P: AsRef<Path>>(name: &str, root_dir: P) -> Result<Self> {
        let path = root_dir
            .as_ref()
            .to_path_buf()
            .join(format!("{}.json", name));
        if !path.is_file() {
            fs::write(path.as_path(), "[]")?;
        }
        Ok(Self {
            name: name.to_string(),
            path,
            data: Vec::new(),
        })
    }
    pub fn read(&mut self) -> Result<()> {
        if !self.path.is_file() {
            log::debug!(
                "table {} file {:?} does not exist, not reading",
                self.name,
                self.path
            );
            return Ok(());
        }
        let file = File::open(self.path.as_path()).context(format!(
            "table {} file {:?} failed to open",
            self.name, self.path
        ))?;
        let reader = BufReader::new(file);
        let data = serde_json::from_reader(reader).context(format!(
            "table {} file {:?} failed to parse",
            self.name, self.path
        ))?;
        self.data = data;
        Ok(())
    }
    pub fn write(&self) -> Result<()> {
        fs::write(
            self.path.as_path(),
            serde_json::to_string(&self.data)
                .context(format!("table {} failed to serialize", self.name))?,
        )
        .context(format!(
            "table {} file {:?} failed to write",
            self.name, self.path
        ))?;
        Ok(())
    }
}
