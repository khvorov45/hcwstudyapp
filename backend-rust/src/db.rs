use crate::{
    auth,
    data::{current, previous},
    error, Result,
};
use anyhow::{bail, Context};
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
    pub schedule: Table<previous::Schedule, current::Schedule>,
    pub weekly_survey: Table<previous::WeeklySurvey, current::WeeklySurvey>,
    pub withdrawn: Table<previous::Withdrawn, current::Withdrawn>,
    pub virus: Table<previous::Virus, current::Virus>,
    pub serology: Table<previous::Serology, current::Serology>,
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

#[derive(serde_derive::Serialize)]
pub struct TableIssues {
    user: UserTableIssues,
    tokens: TokenTableIssues,
    participants: ParticipantTableIssues,
    vaccination: VaccinationTableIssues,
    schedule: ScheduleTableIssues,
    weekly_survey: WeeklySurveyTableIssues,
    withdrawn: WithdrawnTableIssues,
    virus: VirusTableIssues,
    serology: SerologyTableIssues,
}

#[derive(serde_derive::Serialize)]
pub struct TokenTableIssues {
    pk: Vec<KeyIssue<<current::Token as PrimaryKey>::K, current::Token>>,
    fk: Vec<KeyIssue<<current::User as PrimaryKey>::K, current::Token>>,
}

#[derive(serde_derive::Serialize)]
pub struct UserTableIssues {
    pk: Vec<KeyIssue<<current::User as PrimaryKey>::K, current::User>>,
}

#[derive(serde_derive::Serialize)]
pub struct ParticipantTableIssues {
    pk: Vec<KeyIssue<<current::Participant as PrimaryKey>::K, current::Participant>>,
}

#[derive(serde_derive::Serialize)]
pub struct VaccinationTableIssues {
    pk: Vec<KeyIssue<<current::VaccinationHistory as PrimaryKey>::K, current::VaccinationHistory>>,
    fk: Vec<KeyIssue<<current::Participant as PrimaryKey>::K, current::VaccinationHistory>>,
}

#[derive(serde_derive::Serialize)]
pub struct ScheduleTableIssues {
    pk: Vec<KeyIssue<<current::Schedule as PrimaryKey>::K, current::Schedule>>,
    fk: Vec<KeyIssue<<current::Participant as PrimaryKey>::K, current::Schedule>>,
}

#[derive(serde_derive::Serialize)]
pub struct WeeklySurveyTableIssues {
    pk: Vec<KeyIssue<<current::WeeklySurvey as PrimaryKey>::K, current::WeeklySurvey>>,
    fk: Vec<KeyIssue<<current::Participant as PrimaryKey>::K, current::WeeklySurvey>>,
}

#[derive(serde_derive::Serialize)]
pub struct WithdrawnTableIssues {
    pk: Vec<KeyIssue<<current::Withdrawn as PrimaryKey>::K, current::Withdrawn>>,
    fk: Vec<KeyIssue<<current::Participant as PrimaryKey>::K, current::Withdrawn>>,
}

#[derive(serde_derive::Serialize)]
pub struct VirusTableIssues {
    pk: Vec<KeyIssue<<current::Virus as PrimaryKey>::K, current::Virus>>,
}

#[derive(serde_derive::Serialize)]
pub struct SerologyTableIssues {
    pk: Vec<KeyIssue<<current::Serology as PrimaryKey>::K, current::Serology>>,
    fk_participant: Vec<KeyIssue<<current::Participant as PrimaryKey>::K, current::Serology>>,
    fk_virus: Vec<KeyIssue<<current::Virus as PrimaryKey>::K, current::Serology>>,
}

#[derive(serde_derive::Serialize)]
pub struct KeyIssue<K, T> {
    value: K,
    rows: Vec<T>,
}

// ================================================================================================

impl Db {
    /// Will read in the data depending on the initial state of the directories
    /// By the time it's done, the root directory and the current directory
    /// inside it should be created. The previous directory isn't used post-creation.
    pub fn new(dir: &Path, default_admin_email: &str) -> Result<Self> {
        log::debug!("initializing db at root directory {:?}", dir);

        let dirs = DbDirs::new(dir)?;

        let mut db = Self {
            users: Table::new("User", &dirs)?,
            tokens: Table::new("Token", &dirs)?,
            participants: Table::new("Participant", &dirs)?,
            vaccination_history: Table::new("VaccinationHistory", &dirs)?,
            schedule: Table::new("Schedule", &dirs)?,
            weekly_survey: Table::new("WeeklySurvey", &dirs)?,
            withdrawn: Table::new("Withdrawn", &dirs)?,
            virus: Table::new("Virus", &dirs)?,
            serology: Table::new("Serology", &dirs)?,
            dirs,
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
        self.schedule.read(version)?;
        self.weekly_survey.read(version)?;
        self.withdrawn.read(version)?;
        self.virus.read(version)?;
        self.serology.read(version)?;
        Ok(())
    }
    pub fn write(&self) -> Result<()> {
        log::debug!("writing db to disk");
        self.users.write()?;
        self.tokens.write()?;
        self.participants.write()?;
        self.vaccination_history.write()?;
        self.schedule.write()?;
        self.weekly_survey.write()?;
        self.withdrawn.write()?;
        self.virus.write()?;
        self.serology.write()?;
        Ok(())
    }
    pub fn convert(&mut self) {
        log::debug!("converting db");
        self.users.convert();
        self.tokens.convert();
        self.participants.convert();
        self.vaccination_history.convert();
        self.schedule.convert();
        self.weekly_survey.convert();
        self.withdrawn.convert();
        self.virus.convert();
        self.serology.convert();
    }
    pub fn find_table_issues(&mut self) -> TableIssues {
        log::debug!("verifying db");

        let participant_pks = self.participants.get_pks();

        TableIssues {
            user: UserTableIssues {
                pk: self.users.find_pk_issues(),
            },
            tokens: TokenTableIssues {
                pk: self.tokens.find_pk_issues(),
                fk: self
                    .tokens
                    .find_fk_issues(&self.users.get_pks(), |t| t.user.clone()),
            },
            participants: ParticipantTableIssues {
                pk: self.participants.find_pk_issues(),
            },
            vaccination: VaccinationTableIssues {
                pk: self.vaccination_history.find_pk_issues(),
                fk: self
                    .vaccination_history
                    .find_fk_issues(&participant_pks, |v| v.pid.clone()),
            },
            schedule: ScheduleTableIssues {
                pk: self.schedule.find_pk_issues(),
                fk: self
                    .schedule
                    .find_fk_issues(&participant_pks, |v| v.pid.clone()),
            },
            weekly_survey: WeeklySurveyTableIssues {
                pk: self.weekly_survey.find_pk_issues(),
                fk: self
                    .weekly_survey
                    .find_fk_issues(&participant_pks, |v| v.pid.clone()),
            },
            withdrawn: WithdrawnTableIssues {
                pk: self.withdrawn.find_pk_issues(),
                fk: self
                    .withdrawn
                    .find_fk_issues(&participant_pks, |v| v.pid.clone()),
            },
            virus: VirusTableIssues {
                pk: self.virus.find_pk_issues(),
            },
            serology: SerologyTableIssues {
                pk: self.serology.find_pk_issues(),
                fk_participant: self
                    .serology
                    .find_fk_issues(&participant_pks, |v| v.pid.clone()),
                fk_virus: self
                    .serology
                    .find_fk_issues(&self.virus.get_pks(), |v| v.virus.clone()),
            },
        }
    }
    pub fn insert_user(&mut self, user: current::User) -> Result<()> {
        self.users.check_row_pk_absent(&user)?;
        self.users.current.data.push(user);
        self.users.write()?;
        Ok(())
    }
    pub fn insert_token(&mut self, token: current::Token) -> Result<()> {
        self.tokens.check_row_pk_absent(&token)?;
        self.users.try_lookup(&token.user)?;
        self.tokens.current.data.push(token);
        self.tokens.write()?;
        Ok(())
    }

    pub fn token_verify(&self, token: &str) -> Result<current::User> {
        let token_row = match self.tokens.lookup(&auth::hash(token)) {
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
        match self.users.lookup(&token_row.user) {
            Some(u) => Ok(u.clone()),
            None => Err(anyhow::Error::new(error::Unauthorized::NoUserWithToken(
                token.to_string(),
            ))),
        }
    }

    pub fn token_refresh(&mut self, token: &str, len: usize, dtl: i64) -> Result<String> {
        let token_row = match self.tokens.lookup_mut(&auth::hash(token)) {
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

    pub fn get_participants_subset(&self, site: current::Site) -> Vec<&current::Participant> {
        self.participants
            .current
            .data
            .iter()
            .filter(|p| p.site == site)
            .collect()
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

    pub fn sync_redcap_schedule(&mut self, redcap_schedule: Vec<current::Schedule>) -> Result<()> {
        self.schedule.current.data = redcap_schedule;
        self.schedule.write()?;
        Ok(())
    }

    pub fn sync_redcap_weekly_survey(
        &mut self,
        redcap_weekly_survey: Vec<current::WeeklySurvey>,
    ) -> Result<()> {
        self.weekly_survey.current.data = redcap_weekly_survey;
        self.weekly_survey.write()?;
        Ok(())
    }

    pub fn sync_redcap_withdrawn(
        &mut self,
        redcap_withdrawn: Vec<current::Withdrawn>,
    ) -> Result<()> {
        self.withdrawn.current.data = redcap_withdrawn;
        self.withdrawn.write()?;
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
    pub fn map_and_collect<T, F>(&self, f: F) -> Vec<&T>
    where
        F: FnMut(&C) -> &T,
    {
        self.current.data.iter().map(f).collect::<Vec<&T>>()
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

impl<P, C: PrimaryKey + Clone + serde::Serialize> Table<P, C> {
    pub fn get_pks(&self) -> Vec<<C as PrimaryKey>::K> {
        self.current.data.iter().map(|r| r.get_pk()).collect()
    }
    pub fn check_pks_present(&self, pks: &[&<C as PrimaryKey>::K]) -> Result<()> {
        for pk in pks {
            self.try_lookup(pk)?;
        }
        Ok(())
    }
    pub fn check_row_pk_absent(&self, row: &C) -> Result<()> {
        self.check_row_pk_absent_subset(row, &self.current.data)?;
        Ok(())
    }
    fn check_row_pk_absent_subset(&self, row: &C, data: &[C]) -> Result<()> {
        let row_pk = row.get_pk();
        if data.iter().any(|r| row_pk == r.get_pk()) {
            Err(anyhow::Error::new(error::Conflict::PrimaryKey(
                self.name.clone(),
                format!("{:?}", row_pk),
            )))
        } else {
            Ok(())
        }
    }
    pub fn verify_pk(&self) -> Result<()> {
        for (i, row) in self.current.data.iter().enumerate() {
            self.check_row_pk_absent_subset(row, &self.current.data[..i])?;
            self.check_row_pk_absent_subset(row, &self.current.data[(i + 1)..])?;
        }
        Ok(())
    }
    pub fn find_pk_issues(&mut self) -> Vec<KeyIssue<<C as PrimaryKey>::K, C>> {
        log::debug!("Finding PK issues for table {}", self.name);
        let mut issues = Vec::new();

        if self.current.data.len() <= 1 {
            return issues;
        }

        self.current.data.sort_by_key(|r| r.get_pk());

        let mut previous_index = 0;
        let mut previous_pk = self.current.data[previous_index].get_pk();
        for this_index in 1..self.current.data.len() {
            let this_pk = self.current.data[this_index].get_pk();
            if this_pk != previous_pk {
                if this_index - previous_index > 1 {
                    let issue = KeyIssue {
                        value: previous_pk,
                        rows: self.current.data[previous_index..this_index].to_vec(),
                    };
                    issues.push(issue);
                }
                previous_index = this_index;
                previous_pk = this_pk;
            }
        }

        issues
    }
    pub fn find_fk_issues<F: PartialEq + Ord, G: Fn(&C) -> F>(
        &mut self,
        fks: &[F],
        get_fk: G,
    ) -> Vec<KeyIssue<F, C>> {
        log::debug!("Finding FK issues for table {}", self.name);
        let mut issues = Vec::new();

        if self.current.data.is_empty() {
            return issues;
        }

        self.current.data.sort_by_key(|r| get_fk(r));

        let mut previous_index = 0;
        let mut previous_fk = get_fk(&self.current.data[previous_index]);
        for this_index in 0..self.current.data.len() {
            let this_fk = get_fk(&self.current.data[this_index]);
            if this_fk != previous_fk {
                if !fks.contains(&previous_fk) {
                    let issue = KeyIssue {
                        value: previous_fk,
                        rows: self.current.data[previous_index..this_index].to_vec(),
                    };
                    issues.push(issue);
                }
                previous_index = this_index;
                previous_fk = this_fk;
            }
        }

        issues
    }
    pub fn lookup(&self, pk: &<C as PrimaryKey>::K) -> Option<&C> {
        self.current.data.iter().find(|r| &r.get_pk() == pk)
    }
    pub fn lookup_mut(&mut self, pk: &<C as PrimaryKey>::K) -> Option<&mut C> {
        self.current.data.iter_mut().find(|r| &r.get_pk() == pk)
    }
    pub fn try_lookup(&self, pk: &<C as PrimaryKey>::K) -> Result<&C> {
        match self.lookup(pk) {
            Some(k) => Ok(k),
            None => bail!(error::Conflict::PrimaryKey(
                self.name.clone(),
                format!("{:?}", pk)
            )),
        }
    }
    pub fn try_lookup_mut(&mut self, pk: &<C as PrimaryKey>::K) -> Result<&mut C> {
        let own_name = self.name.clone();
        match self.lookup_mut(pk) {
            Some(k) => Ok(k),
            None => bail!(error::Conflict::PrimaryKey(own_name, format!("{:?}", pk))),
        }
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
            init_state,
            root,
            previous,
            current,
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

pub trait PrimaryKey {
    type K: std::fmt::Debug + PartialEq + PartialOrd + Ord + serde::Serialize;
    fn get_pk(&self) -> Self::K;
}
