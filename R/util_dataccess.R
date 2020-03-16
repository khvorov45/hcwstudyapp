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
      redcap_event_name = tolower(.data$redcap_event_name),
      num_seas_vac = as.integer(.data$num_seas_vac),
      eligible_extra_bleed = as.integer(.data$eligible_extra_bleed),
      ari_definition = as.integer(.data$ari_definition),
      site_name = if_else(is.na(.data$site_name), "(Missing)", .data$site_name),
      b1_medicalhx = redcap_to_listcol("b1_medicalhx", medicalhx_altnames, raw)
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
  if (access_group == "all") {
    return(raw)
  }
  if (access_group == "none") {
    return(filter(raw, .data$record_id == -1))
  }
  all_sites <- unique(stats::na.omit(raw$site_name))
  if (!all(all_sites %in% site_altnames)) {
    rlang::abort(
      "Site names in data not recognised",
      class = "redcap_extra_sites"
    )
  }
  ids <- raw %>%
    filter(.data$site_name == get_site_name(access_group)) %>%
    pull(.data$record_id)
  raw_subset <- raw %>%
    filter(.data$record_id %in% ids)
  raw_subset
}

#' Subsets the REDCap table to only those who consented
#'
#' @inheritParams reformat_cols
#'
#' @export
subset_consent <- function(raw) {
  consented <- raw %>%
    filter(.data$consent == "Yes") %>%
    pull(.data$record_id)
  filter(raw, .data$record_id %in% consented)
}

#' Extracts the participant table from the baseline table
#'
#' Everyone who has consented is a participant. I'm relying on the 'consent'
#' variable for this. The participant table contains every attribute that each
#' participant has one of except the screening-related attributes (not everyone
#' who is screened consents).
#'
#' @param raw_consented Consented subset of the REDCap table
#'
#' @importFrom rlang .data !!!
#'
#' @export
get_tbl_participant <- function(raw_consented) {
  needed_cols <- c(
    "record_id", "pid", "site_name", "date_screening",
    "num_seas_vac", "eligible_extra_bleed", "add_bleed",
    "mobile_number", "email",
    "a1_gender", "a2_dob", "a3_atsi", "a4_children",
    "a5_height", "a6_weight",
    "b1_medicalhx",
    "c1_yrs_employed", "c2_emp_status", "c3_occupation",
    "c3_spec",
    "c4_spec", "c5_clin_care", "d1_future_vacc"
  )
  raw_consented %>%
    filter(.data$redcap_event_name == "baseline") %>%
    select(!!!rlang::syms(needed_cols)) %>%
    mutate(
      age_screening = lubridate::interval(.data$a2_dob, .data$date_screening) /
        lubridate::dyears(1)
    )
}

#' Extracts the symptom table
#'
#' @inheritParams get_tbl_participant
#'
#' @export
get_tbl_symptom <- function(raw_consented) {
  needed_cols <- c(
    "record_id", "date_symptom_survey", "ari_definition"
  )
  raw_consented %>%
    filter(
      stringr::str_detect(.data$redcap_event_name, "weekly survey ")
    ) %>%
    select(!!!rlang::syms(needed_cols))
}

#' Extracts the swab table
#'
#' @inheritParams get_tbl_participant
#'
#' @export
get_tbl_swab <- function(raw_consented) {
  needed_cols <- c(
    "record_id", "swab_collection", "samp_date", "survey_week",
    "site_rec_date", "site_test_date", "doherty_swab_sent_date",
    "symptom_duration"
  )
  raw_consented %>%
    filter(.data$redcap_event_name == "infection") %>%
    select(!!!rlang::syms(needed_cols))
}

#' Extracts all proper tables from the event tables
#'
#' @inheritParams reformat_cols
#'
#' @export
get_tbls <- function(raw) {
  raw_consented <- subset_consent(raw)
  list(
    participant = get_tbl_participant(raw_consented),
    symptom = get_tbl_symptom(raw_consented),
    swab = get_tbl_swab(raw_consented)
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

#' Converts RedCAP's checkbox representation into a list-column
#'
#' @param data RedCAP table
#' @param var_name Name (also prefix) of the checkbox variable
#' @param var_key Named list that converts numbers to labels
#'
#' @importFrom rlang :=
#'
#' @noRd
redcap_to_listcol <- function(var_name, var_key, data) {
  internal_fun <- function(resp, check) {
    if (all(is.na(check)) | all(check == "Unchecked")) {
      return(list(NA))
    }
    list(resp[check == "Checked"])
  }
  data %>%
    select(
      !!!rlang::syms(glue::glue("{var_name}___{names(var_key)}"))
    ) %>%
    mutate(row_index = row_number()) %>%
    tidyr::pivot_longer(-.data$row_index, var_name, values_to = "response") %>%
    mutate(
      !!rlang::sym(var_name) := stringr::str_replace(
        !!rlang::sym(var_name), glue::glue("{var_name}___"), ""
      ) %>% recode(!!!var_key)
    ) %>%
    group_by(.data$row_index) %>%
    summarise(
      !!rlang::sym(var_name) := internal_fun(
        !!rlang::sym(var_name), .data$response
      )
    ) %>%
    pull(!!rlang::sym(var_name))
}
