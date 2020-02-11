#' Access the raw RedCap data table
#'
#' @param token Redcap api token
#' @param uri Redcap uri
#'
#' @export
get_redcap_data <- function(token, uri = "https://biredcap.mh.org.au/api/") {
  tibble::as_tibble(
    REDCapR::redcap_read_oneshot(uri, token, verbose = FALSE)$data
  )
}
