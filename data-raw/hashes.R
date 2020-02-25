# Setting up hashes for password checking

# 'key' is a file containing hash key in project directory
api_pass_key <- readLines("key")

# 'token' is a file containing the REDCap API token in project directory
api_token <- readLines("token")

# 'site-passwords' is a space-separated table in data-raw
site_passwords <- readr::read_table2(
  "data-raw/site-passwords",
  col_types = readr::cols_only(
    site = readr::col_character(),
    password = readr::col_character()
  )
)

create_hash_values <- function(passwords) {
  purrr::map_chr(passwords, ~ openssl::sha256(.x, key = api_pass_key))
}

site_passwords_hashes <- site_passwords %>%
  mutate(hash = create_hash_values(password)) %>%
  select(-password)

api_token_hash <- create_hash_values(api_token)

# Add token to allowed passwords
password_hashes <- bind_rows(
  rename(site_passwords_hashes, access = site),
  tibble(access = "all", hash = api_token_hash)
)

hash_list <- list(
  password_hashes = password_hashes,
  api_token_hash = api_token_hash
)

usethis::use_data(hash_list, internal = TRUE, overwrite = TRUE)
