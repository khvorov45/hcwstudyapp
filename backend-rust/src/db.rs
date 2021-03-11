use crate::{data, Result};
use anyhow::Context;
use serde::{de::DeserializeOwned, Serialize};
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};

pub struct Db {
    pub dirs: DbDirs,
    pub users: Table<data::User>,
}

pub struct DbDirs {
    pub init_state: DbDirsInitState,
    pub root: PathBuf,
    pub previous: PathBuf,
    pub current: PathBuf,
}

pub enum DbDirsInitState {
    /// No directories present at init
    None,
    /// Only the previous directory present at init
    Previous,
    /// Current directory present at init
    Current,
}

pub struct Table<T: Serialize + DeserializeOwned> {
    pub name: String,
    pub path: PathBuf,
    pub data: Vec<T>,
}

impl Db {
    pub fn new(dir: PathBuf) -> Result<Self> {
        let mut db = Self {
            dirs: DbDirs::new(dir.as_path())?,
            users: Table::new("User", dir.as_path())?,
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

impl DbDirs {
    pub fn new<P: AsRef<Path>>(root: P) -> Result<Self> {
        let root = root.as_ref().to_path_buf();
        let previous = root.join("previous");
        let current = root.join("current");
        let mut init_state = DbDirsInitState::None;

        if current.is_dir() {
            init_state = DbDirsInitState::Current;
        } else if previous.is_dir() {
            init_state = DbDirsInitState::Previous;
        }

        if !root.is_dir() {
            fs::create_dir(root.as_path())?;
        }
        if !current.is_dir() {
            fs::create_dir(current.as_path())?;
        }

        Ok(Self {
            root,
            previous,
            current,
            init_state,
        })
    }
}
