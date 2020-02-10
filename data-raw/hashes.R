## code to prepare `DATASET` dataset goes here

create_hash_values <- function(...) {
  purrr::map_chr(
    list(...),
    ~ openssl::sha256(process_token(.x), key = "hcwskrsrv!")
  )
}

api_pass_hashes <- create_hash_values(
  "token", "data-raw/token-alt"
)

usethis::use_data(api_pass_hashes, internal = TRUE, overwrite = TRUE)
