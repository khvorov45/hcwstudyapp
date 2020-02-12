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
      record_id = as.integer(.data$record_id),
      site_name = as.integer(.data$site_name),
      screening_interest = as.integer(.data$screening_interest),
      screening_age = as.integer(.data$screening_age),
      screening_employee = as.integer(.data$screening_employee),
      screening_recent_rx = as.integer(.data$screening_recent_rx),
      screening_ill = as.integer(.data$screening_ill),
      num_seas_vac = as.integer(.data$num_seas_vac),
      eligible_extra_bleed = as.integer(.data$eligible_extra_bleed),
      screening_complete = as.integer(.data$screening_complete)
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

#' Extracts the participant table from the baseline table
#'
#' The participant table contains every attribute that each participant has
#' one of except the screening-related attributes.
#'
#' @param baseline The baseline table
#'
#' @export
get_tbl_participant <- function(baseline) {
  baseline %>%
    dplyr::select(
      "record_id", "site_name", "num_seas_vac", "eligible_extra_bleed"
    )
}

#' Extracts all proper tables from the event tables
#'
#' @param raw_list List returned by \code{\link{raw_to_list}}
#'
#' @export
get_tbls <- function(raw_list) {
  list(
    participant = get_tbl_participant(raw_list$baseline)
  )
}
