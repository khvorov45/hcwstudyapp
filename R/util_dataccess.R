#' Access the raw RedCap data table
#'
#' Will subset by access_group when it is not 'all'
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
  as_tibble(rcap$data)
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
    mutate(
      record_id = as.integer(.data$record_id),
      redcap_event_name = tolower(.data$redcap_event_name),
      num_seas_vac = as.integer(.data$num_seas_vac),
      eligible_extra_bleed = as.integer(.data$eligible_extra_bleed)
    )
}

#' Subsets raw REDCap table by access group defined by sites
#'
#' If all - doesn't do anything
#' If none - removes all rows
#'
#' @inheritParams reformat_cols
#' @param access_group Access group to subset the data
#'
#' @export
redcap_subset <- function(raw, access_group) {
  if (access_group == "all") return(raw)
  if (access_group == "none") return(filter(raw, .data$record_id == -1))
  all_sites <- unique(stats::na.omit(raw$site_name))
  if (!all(all_sites %in% site_altnames))
    rlang::abort(
      "Site names in data not recognised",
      class = "redcap_extra_sites"
    )
  ids <- raw %>%
    filter(.data$site_name == get_site_name(access_group)) %>%
    pull(.data$record_id)
  raw_subset <- raw %>%
    filter(.data$record_id %in% ids)
  raw_subset
}

#' Extracts the participant table from the baseline table
#'
#' Everyone who has consented is a participant. I'm relying on the 'consent'
#' variable for this. The participant table contains every attribute that each
#' participant has one of except the screening-related attributes (not everyone
#' who is screened consents).
#'
#' @inheritParams reformat_cols
#'
#' @importFrom rlang .data !!!
#'
#' @export
get_tbl_participant <- function(raw) {
  needed_cols <- c(
    "record_id", "pid", "site_name", "num_seas_vac", "eligible_extra_bleed",
    "first_name", "surname",
    "mobile_number", "email"
  )
  raw %>%
    filter(.data$consent == "Yes") %>%
    select(!!!rlang::syms(needed_cols))
}

#' Extracts all proper tables from the event tables
#'
#' @inheritParams reformat_cols
#'
#' @export
get_tbls <- function(raw) {
  list(
    participant = get_tbl_participant(raw)
  )
}

#' Downloads REDCap's data and transforms it
#'
#' @inheritParams get_redcap_data
#' @inheritParams redcap_subset
#'
#' @export
down_trans_redcap <- function(token, uri = "https://biredcap.mh.org.au/api/",
                              access_group = "all") {
  get_redcap_data(token, uri) %>%
    reformat_cols() %>%
    redcap_subset(access_group) %>%
    get_tbls()
}
