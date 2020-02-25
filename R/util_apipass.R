#' Checks if the given apipass hash is in opts
#'
#' @param apipass Password (not hashed) to check
#' @param key Key used for hash creation
#' @param opts Options (hashed) to check against
#'
#' @noRd
apipass_matches <- function(apipass, key, opts) {
  openssl::sha256(apipass, key) %in% opts
}

#' Finds the access group that corresponds to apipass
#'
#' Returns 'none' when no match is found
#'
#' @param apipass Password (not hashed)
#' @param key Key used for hash creation
#' @param hash_tbl A table with columns 'access' and 'hash'
#'
#' @noRd
find_apipass_match <- function(apipass, key,
                               hash_tbl = hash_list$password_hashes) {
  mtch <- hash_tbl$access[hash_tbl$hash == openssl::sha256(apipass, key)]
  if (identical(mtch, character(0))) mtch <- "none"
  mtch
}
