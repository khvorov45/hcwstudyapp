#' Processes the RedCap api password
#'
#' If file is not found, returns an empty string.
#'
#' @param pass_path Path to file containing the token
#'
#' @noRd
process_apipass <- function(pass_path) {
  if (is.null(pass_path) | !is.character(pass_path))
    rlang::abort(
      glue::glue("pass_path should be a path to text file\n",),
      class = "wrong_apipass"
    )
  if (!file.exists(pass_path)) return("")
  stringr::str_trim(
    readChar(pass_path, file.info(pass_path)$size), side = "both"
  )
}

#' Checks if the given apipass hash is in opts
#'
#' @param apipass Password to check
#' @param opts Options to check against
#'
#' @noRd
apipass_matches <- function(apipass, opts = api_pass_hashes) {
  openssl::sha256(apipass, key = api_pass_key) %in% opts
}
