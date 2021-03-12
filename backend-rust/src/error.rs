use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("PK in table {0} conflict; value: {1}")]
    PrimaryKeyConflict(String, String),
    #[error("FK in table {0} (parent table {1}) conflict; value: {2}")]
    ForeignKeyConflict(String, String, String),
}
