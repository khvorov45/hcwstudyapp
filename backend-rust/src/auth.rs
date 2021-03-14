use crate::error;

pub fn parse_bearer_header(raw: &str) -> Result<&str, error::Unauthorized> {
    let header: Vec<&str> = raw.splitn(2, ' ').collect();
    if header[0] != "Bearer" {
        return Err(error::Unauthorized::WrongAuthType(header[0].to_string()));
    }
    Ok(header[1])
}
