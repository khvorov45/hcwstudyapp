use crate::error;

pub fn parse_bearer_header(raw: &str) -> Result<&str, error::Unauthorized> {
    let header: Vec<&str> = raw.splitn(2, ' ').collect();
    if header[0] != "Bearer" {
        return Err(error::Unauthorized::WrongAuthType(header[0].to_string()));
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
