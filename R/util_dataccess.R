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

#' Reformat variables
#'
#' @param raw Raw redcap data
#'
#' @importFrom rlang .data
#'
#' @export
reformat_cols <- function(raw) {
  raw %>%
    dplyr::mutate(
      record_id = as.integer(.data$record_id)
    )
}
#' Convert to list
#'
#' Convert raw data to a list where each entry is an event
#'
#' @param raw Raw redcap data
#'
#' @export
raw_to_list <- function(raw) {
  lst <- raw %>%
    dplyr::group_split(.data$redcap_event_name) %>%
    purrr::map(~ dplyr::select_if(.x, function(vec) !all(is.na(vec))))
  names(lst) <- purrr::map_chr(
    lst, function(dat) unique(dat$redcap_event_name) %>%
      stringr::str_replace("_arm_1", "")
  )
  lst %>% purrr::map(~ dplyr::select(.x, -redcap_event_name))
}
