use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("PK in table {0} conflict; value: {1}")]
    PrimaryKeyConflict(String, String),
}
