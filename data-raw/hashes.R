## code to prepare `DATASET` dataset goes here

api_pass_key <- "hcwskrsrv!"

create_hash_values <- function(...) {
  purrr::map_chr(
    list(...),
    ~ openssl::sha256(hcwstudyapp:::process_apipass(.x), key = api_pass_key)
  )
}

api_pass_hashes <- create_hash_values(
  "token", "data-raw/token-alt"
)

usethis::use_data(
  api_pass_hashes, api_pass_key,
  internal = TRUE, overwrite = TRUE
)
