use crate::{error, Result};

pub fn parse_bearer_header(raw: &str) -> Result<&str> {
    let header: Vec<&str> = raw.splitn(2, ' ').collect();
    if header[0] != "Bearer" {
        return Err(anyhow::Error::new(error::Unauthorized::WrongAuthType(
            header[0].to_string(),
        )));
    }
    Ok(header[1])
}

pub fn random_string(len: usize) -> String {
    use rand::Rng;
    rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(len)
        .map(|x| x as char)
        .collect()
}

pub fn hash(s: &str) -> String {
    use sha2::Digest;
    let mut hasher = sha2::Sha512::new();
    hasher.update(s.as_bytes());
    let hash_result = hasher.finalize();
    hex::encode(&hash_result)
}
