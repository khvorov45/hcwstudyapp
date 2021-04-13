use crate::{
    auth,
    data::{current, previous},
    error, Result,
};
use anyhow::Context;
use serde::{de::DeserializeOwned, Serialize};
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};

pub struct Db {
    pub dirs: DbDirs,
    pub users: Table<previous::User, current::User>,
    pub tokens: Table<previous::Token, current::Token>,
    pub participants: Table<previous::Participant, current::Participant>,
    pub vaccination_history: Table<previous::VaccinationHistory, current::VaccinationHistory>,
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

#[derive(Debug, Clone, Copy)]
pub enum Version {
    Previous,
    Current,
}

// ================================================================================================

impl Db {
    /// Will read in the data depending on the initial state of the directories
    /// By the time it's done, the root directory and the current directory
    /// inside it should be created. The previous directory isn't used post-creation.
    pub fn new(dir: &Path, default_admin_email: &str) -> Result<Self> {
        log::debug!("initializing db at root directory {:?}", dir);

        let dirs = DbDirs::new(dir)?;

        let users = Table::new("User", &dirs)?;
        let tokens = Table::new("Token", &dirs)?;
        let participants = Table::new("Participant", &dirs)?;
        let vaccination_history = Table::new("VaccinationHistory", &dirs)?;

        let mut db = Self {
            dirs,
            users,
            tokens,
            participants,
            vaccination_history,
        };

        match db.dirs.init_state {
            DbDirsInitState::Previous => {
                log::debug!("only previous data found, will attempt to convert");
                db.read(Version::Previous)?;
                db.convert();
                // Create directory right before writing so that there isn't anything to
                // clean up if any step before this fails
                fs::create_dir(db.dirs.current.as_path())?;
                db.write()?;
            }
            DbDirsInitState::Current => {
                log::debug!("current data found, reading");
                db.read(Version::Current)?;
            }
            // The data is empty by default anyway, don't need to read
            DbDirsInitState::None => {
                log::debug!("no data found, not reading")
            }
        }

        // Make sure one admin exists
        if db.users.current.data.is_empty() {
            log::debug!("users empty, inserting default admin");
            db.users.current.data.push(current::User {
                email: default_admin_email.to_lowercase(),
                access_group: current::AccessGroup::Admin,
                kind: current::UserKind::Manual,
                deidentified_export: false,
            });
            db.users.write()?;
        }

        Ok(db)
    }
    pub fn read(&mut self, version: Version) -> Result<()> {
        log::debug!("reading db version {:?} from disk", version);
        self.users.read(version)?;
        self.tokens.read(version)?;
        self.participants.read(version)?;
        self.vaccination_history.read(version)?;
        Ok(())
    }
    pub fn write(&self) -> Result<()> {
        log::debug!("writing db to disk");
        self.users.write()?;
        self.tokens.write()?;
        self.participants.write()?;
        self.vaccination_history.write()?;
        Ok(())
    }
    pub fn convert(&mut self) {
        log::debug!("converting db");
        self.users.convert();
        self.tokens.convert();
        self.participants.convert();
        self.vaccination_history.convert();
    }
    pub fn verify(&mut self) -> Result<()> {
        log::debug!("verifying db");
        self.users.verify_pk()?;
        self.tokens.verify_pk()?;
        self.tokens.verify_fk(&self.users)?;
        self.participants.verify_pk()?;
        self.vaccination_history.verify_pk()?;
        self.vaccination_history.verify_fk(&self.participants)?;
        Ok(())
    }
    pub fn insert_user(&mut self, user: current::User) -> Result<()> {
        self.users.check_row_pk(&user)?;
        self.users.current.data.push(user);
        self.users.write()?;
        Ok(())
    }
    pub fn insert_token(&mut self, token: current::Token) -> Result<()> {
        self.tokens.check_row_pk(&token)?;
        self.tokens.check_row_fk(&token, &self.users)?;
        self.tokens.current.data.push(token);
        self.tokens.write()?;
        Ok(())
    }

    pub fn token_verify(&self, token: &str) -> Result<current::User> {
        let token_row = match self.tokens.lookup(auth::hash(token).as_str()) {
            Some(t) => t,
            None => {
                return Err(anyhow::Error::new(error::Unauthorized::NoSuchToken(
                    token.to_string(),
                )))
            }
        };
        if token_row.is_expired() {
            return Err(anyhow::Error::new(error::Unauthorized::TokenExpired(
                token.to_string(),
            )));
        }
        match self.users.lookup(token_row.user.as_str()) {
            Some(u) => Ok(u.clone()),
            None => Err(anyhow::Error::new(error::Unauthorized::NoUserWithToken(
                token.to_string(),
            ))),
        }
    }

    pub fn token_refresh(&mut self, token: &str, len: usize, dtl: i64) -> Result<String> {
        let token_row = match self.tokens.lookup_mut(auth::hash(token).as_str()) {
            Some(t) => t,
            None => {
                return Err(anyhow::Error::new(error::Unauthorized::NoSuchToken(
                    token.to_string(),
                )))
            }
        };
        if token_row.kind == current::TokenKind::Api {
            return Err(anyhow::Error::new(error::Conflict::WrongTokenKind(
                current::TokenKind::Api,
            )));
        }
        let before_hash = auth::random_string(len);
        token_row.hash = auth::hash(before_hash.as_str());
        token_row.expires = Some(chrono::Utc::now() + chrono::Duration::days(dtl));
        self.tokens.write()?;
        Ok(before_hash)
    }

    pub fn sync_redcap_users(&mut self, mut redcap_users: Vec<current::User>) -> Result<()> {
        let users = &mut self.users.current.data;

        users.retain(|u| u.kind == current::UserKind::Manual);
        redcap_users.retain(|redcap_user| {
            users
                .iter()
                .all(|manual_user| redcap_user.email != manual_user.email)
        });
        users.append(&mut redcap_users);

        let tokens = &mut self.tokens.current.data;

        tokens.retain(|t| users.iter().any(|u| u.email == t.user));

        self.users.write()?;
        self.tokens.write()?;

        Ok(())
    }

    pub fn sync_redcap_participants(
        &mut self,
        redcap_participants: Vec<current::Participant>,
    ) -> Result<()> {
        self.participants.current.data = redcap_participants;
        self.participants.write()?;
        Ok(())
    }

    pub fn sync_redcap_vaccination_history(
        &mut self,
        redcap_vaccination_history: Vec<current::VaccinationHistory>,
    ) -> Result<()> {
        self.vaccination_history.current.data = redcap_vaccination_history;
        self.vaccination_history.write()?;
        Ok(())
    }
}

impl<P, C> Table<P, C> {
    /// Creates table with empty data
    pub fn new(name: &str, dirs: &DbDirs) -> Result<Self> {
        log::debug!("creating table {}", name);
        let file_name = format!("{}.json", name);
        let previous = dirs.previous.join(file_name.as_str());
        let current = dirs.current.join(file_name);
        if dirs.init_state == DbDirsInitState::Previous {
            if !previous.is_file() {
                fs::write(previous.as_path(), "[]")
                    .context(format!("could not write file {:?}", previous))?;
            }
        } else if !current.is_file() {
            fs::write(current.as_path(), "[]")
                .context(format!("could not write file {:?}", current))?;
        }
        Ok(Self {
            name: name.to_string(),
            previous: TableData::new(previous),
            current: TableData::new(current),
        })
    }
}

impl<P: DeserializeOwned, C: DeserializeOwned> Table<P, C> {
    pub fn read(&mut self, version: Version) -> Result<()> {
        match version {
            Version::Previous => {
                self.previous.read()?;
            }
            Version::Current => {
                self.current.read()?;
            }
        }
        Ok(())
    }
}

impl<P, C: Serialize> Table<P, C> {
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
}

impl<P: ToCurrent<C>, C> Table<P, C> {
    pub fn convert(&mut self) {
        let mut converted = Vec::with_capacity(self.previous.data.len());
        for row in &self.previous.data {
            converted.push(row.to_current());
        }
        self.current.data = converted;
    }
}

impl<P, C: PrimaryKey<String>> Table<P, C> {
    pub fn check_row_pk(&self, row: &C) -> Result<()> {
        self.check_row_pk_subset(row, &self.current.data)?;
        Ok(())
    }
    fn check_row_pk_subset(&self, row: &C, data: &[C]) -> Result<()> {
        let row_pk = row.get_pk();
        if data.iter().any(|r| row_pk == r.get_pk()) {
            Err(anyhow::Error::new(error::Conflict::PrimaryKey(
                self.name.clone(),
                row_pk,
            )))
        } else {
            Ok(())
        }
    }
    pub fn verify_pk(&self) -> Result<()> {
        for (i, row) in self.current.data.iter().enumerate() {
            self.check_row_pk_subset(row, &self.current.data[..i])?;
            self.check_row_pk_subset(row, &self.current.data[(i + 1)..])?;
        }
        Ok(())
    }
    pub fn lookup(&self, pk: &str) -> Option<&C> {
        self.current.data.iter().find(|r| r.get_pk() == pk)
    }
    pub fn lookup_mut(&mut self, pk: &str) -> Option<&mut C> {
        self.current.data.iter_mut().find(|r| r.get_pk() == pk)
    }
}

impl<P, C: ForeignKey<String>> Table<P, C> {
    pub fn check_row_fk<A, B: PrimaryKey<String>>(
        &self,
        row: &C,
        parent: &Table<A, B>,
    ) -> Result<()> {
        let row_fk = row.get_fk();
        if !parent.current.data.iter().any(|r| row_fk == r.get_pk()) {
            Err(anyhow::Error::new(error::Conflict::ForeignKey(
                self.name.clone(),
                parent.name.clone(),
                row_fk,
            )))
        } else {
            Ok(())
        }
    }
    pub fn verify_fk<A, B: PrimaryKey<String>>(&self, parent: &Table<A, B>) -> Result<()> {
        for row in &self.current.data {
            self.check_row_fk(row, parent)?;
        }
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

        if init_state == DbDirsInitState::None {
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

impl<T> TableData<T> {
    /// Empty data
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            data: Vec::new(),
        }
    }
}

impl<T: DeserializeOwned> TableData<T> {
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

pub trait PrimaryKey<K> {
    fn get_pk(&self) -> K;
}

pub trait ForeignKey<K> {
    fn get_fk(&self) -> K;
}
