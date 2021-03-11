use crate::{data, Result};
use anyhow::Context;
use serde::{de::DeserializeOwned, Serialize};
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};

pub struct Db {
    pub dirs: DbDirs,
    pub users: Table<data::User, data::User>,
}

pub struct DbDirs {
    pub init_state: DbDirsInitState,
    pub root: PathBuf,
    pub previous: PathBuf,
    pub current: PathBuf,
}

#[derive(PartialEq)]
pub enum DbDirsInitState {
    /// No directories present at init
    None,
    /// Only the previous directory present at init
    Previous,
    /// Current directory present at init
    Current,
}

pub struct Table<P, C> {
    pub name: String,
    pub previous: TableData<P>,
    pub current: TableData<C>,
}

pub struct TableData<T> {
    pub path: PathBuf,
    pub data: Vec<T>,
}

#[derive(Debug)]
pub enum Version {
    Previous,
    Current,
}

// ================================================================================================

impl Db {
    /// Will read in the data depending on the initial state of the directories
    pub fn new(dir: PathBuf) -> Result<Self> {
        log::debug!("initializing db at root directory {:?}", dir);

        let dirs = DbDirs::new(dir.as_path())?;
        let users = Table::new("User", &dirs)?;

        let mut db = Self { dirs, users };

        if db.dirs.init_state == DbDirsInitState::Previous {
            match db.read(Version::Previous) {
                Ok(()) => {}
                Err(e) => {
                    fs::remove_dir_all(db.dirs.current.as_path())?;
                    return Err(e);
                }
            };
        } else if db.dirs.init_state == DbDirsInitState::Current {
            db.read(Version::Current)?;
        }

        Ok(db)
    }
    pub fn read(&mut self, version: Version) -> Result<()> {
        log::debug!("reading db version {:?} from disk", version);
        self.users.read(version)?;
        Ok(())
    }
    pub fn write_to_disk(&self) -> Result<()> {
        log::debug!("writing db to disk");
        self.users.write()?;
        Ok(())
    }
}

impl<P: Serialize + DeserializeOwned + ToCurrent<C>, C: Serialize + DeserializeOwned> Table<P, C> {
    /// Creates table with empty data
    pub fn new(name: &str, dirs: &DbDirs) -> Result<Self> {
        let file_name = format!("{}.json", name);
        let previous = dirs.previous.join(file_name.as_str());
        let current = dirs.current.join(file_name);
        if dirs.init_state == DbDirsInitState::Previous && !previous.is_file() {
            fs::write(previous.as_path(), "[]")?;
        }
        if !current.is_file() {
            fs::write(current.as_path(), "[]")?;
        }
        Ok(Self {
            name: name.to_string(),
            previous: TableData::new(previous),
            current: TableData::new(current),
        })
    }
    pub fn read(&mut self, version: Version) -> Result<()> {
        match version {
            Version::Previous => {
                self.previous.read()?;
                self.convert();
            }
            Version::Current => {
                self.current.read()?;
            }
        }
        Ok(())
    }
    pub fn write(&self) -> Result<()> {
        fs::write(
            self.current.path.as_path(),
            serde_json::to_string(&self.current.data)
                .context(format!("table {} failed to serialize", self.name))?,
        )
        .context(format!(
            "table {} file {:?} failed to write",
            self.name, self.current.path
        ))?;
        Ok(())
    }
    pub fn convert(&mut self) {
        let mut converted = Vec::with_capacity(self.previous.data.len());
        for row in &self.previous.data {
            converted.push(row.to_current());
        }
        self.current.data = converted;
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

impl<T: Serialize + DeserializeOwned> TableData<T> {
    /// Empty data
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            data: Vec::new(),
        }
    }
    pub fn read(&mut self) -> Result<()> {
        let file = File::open(self.path.as_path())
            .context(format!("file {:?} failed to open", self.path,))?;

        let reader = BufReader::new(file);
        let data = serde_json::from_reader(reader)
            .context(format!("file {:?} failed to parse", self.path))?;

        self.data = data;

        Ok(())
    }
}

pub trait ToCurrent<C> {
    fn to_current(&self) -> C;
}
