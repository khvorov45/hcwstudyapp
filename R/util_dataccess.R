#' Access the raw RedCap data table
#'
#' @param token Redcap api token
#' @param uri Redcap uri
#'
#' @export
get_redcap_data <- function(token, uri = "https://biredcap.mh.org.au/api/") {
  rcap <- REDCapR::redcap_read_oneshot(
    uri, token,
    verbose = FALSE,
    raw_or_label = "label"
  )
  tibble::as_tibble(rcap$data)
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
      redcap_event_name = tolower(.data$redcap_event_name),
      num_seas_vac = as.integer(.data$num_seas_vac),
      eligible_extra_bleed = as.integer(.data$eligible_extra_bleed)
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

#' Downloads REDCap's data and transforms it
#'
#' @inheritParams get_redcap_data
#'
#' @export
down_trans_redcap <- function(token, uri = "https://biredcap.mh.org.au/api/") {
  get_redcap_data(token, uri) %>%
    reformat_cols() %>%
    raw_to_list() %>%
    get_tbls()
}
