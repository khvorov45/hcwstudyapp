#' Access the raw RedCap data table
#'
#' Will subset by access_group when it is not 'all'
#'
#' @param token Redcap api token
#' @param uri Redcap uri
#'
#' @import readr
#'
#' @export
get_redcap_data <- function(token, uri = "https://biredcap.mh.org.au/api/") {
  rcap <- REDCapR::redcap_read_oneshot(
    uri, token,
    verbose = FALSE,
    raw_or_label = "label",
    col_types = cols(
      ae_date = col_date(),
      consent_unvacc = col_character(),
      ae_desc = col_character(),
      date_ae_resolved = col_date(),
      ae_action_taken = col_character(),
      ae_outcome = col_character(),
      ae_severity = col_character(),
      sae = col_character(),
      ae_report_hrec = col_character(),
      adverse_events_complete = col_character(),
      withdrawn = col_character(),
      withdrawal_date = col_character(),
      withdrawal_reason = col_character(),
      withdrawal_complete = col_character(),
      age_contact31 = col_double(),
      firstname_unvacc = col_character(),
      surname_unvacc = col_character(),
      econsent_date_unvacc = col_character(),
      esignature_unvacc = col_skip(),
      sitestaff_name_uv = col_character(),
      sitestaff_signature_uv = col_skip(),
      date_site_sign_uv = col_date(),
      swab_other = col_character()
    )
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
      b1_medicalhx = redcap_to_listcol("b1_medicalhx", medicalhx_altnames, raw),
      swab_result = redcap_to_listcol("swab_result", swabres_altnames, raw),
      c4_workdept = redcap_to_listcol("c4_workdept", workdept_altnames, raw)
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
    "mobile_number", "email", "baseline_q_date",
    "a1_gender", "a2_dob", "a3_atsi", "a4_children",
    "a5_height", "a6_weight",
    "b1_medicalhx",
    "c1_yrs_employed", "c2_emp_status", "c3_occupation",
    "c3_spec", "c4_workdept",
    "c4_spec", "c5_clin_care", "d1_future_vacc",
    "scheduled_date_v0", "scheduled_date_v7", "scheduled_date_v14",
    "scheduled_date_v280"
  )
  raw_consented %>%
    filter(.data$redcap_event_name == "baseline") %>%
    select(!!!rlang::syms(needed_cols)) %>%
    mutate(
      age_screening = lubridate::interval(.data$a2_dob, .data$date_screening) /
        lubridate::dyears(1),
      bmi = .data$a6_weight / (.data$a5_height / 100)^2
    )
}

#' Extracts the symptom table
#'
#' @inheritParams get_tbl_participant
#'
#' @export
get_tbl_symptom <- function(raw_consented) {
  needed_cols <- c(
    "record_id", "survey_week_index",
    "date_symptom_survey", "ari_definition", "swab_collection",
    "site_rec_date", "site_test_date", "swab_result"
  )
  raw_consented %>%
    filter(
      stringr::str_detect(.data$redcap_event_name, "weekly survey ")
    ) %>%
    mutate(
      survey_week_index = stringr::str_replace(
        .data$redcap_event_name, "weekly survey ", ""
      ) %>% as.integer()
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
    "site_rec_date", "site_test_date", "swab_result"
  )
  raw_consented %>%
    filter(.data$redcap_event_name == "infection") %>%
    select(!!!rlang::syms(needed_cols))
}

#' Extracts the withdrawal table
#'
#' @inheritParams reformat_cols
#'
#' @export
get_tbl_withdrawal <- function(raw) {
  needed_cols <- c(
    "record_id", "withdrawn", "withdrawal_date", "withdrawal_reason"
  )
  raw %>%
    filter(.data$redcap_event_name == "withdrawal") %>%
    select(!!!rlang::syms(needed_cols))
}

#' Extracts all proper tables from the event tables
#'
#' @inheritParams reformat_cols
#'
#' @export
get_tbls <- function(raw) {
  # Consent is split across multiple forms that can conflict with each other,
  # so let's not account for it for now
  # raw_consented <- subset_consent(raw)
  all_part <- get_tbl_participant(raw)
  list(
    participant = all_part,
    participant_essential = all_part %>%
      select("record_id", "pid", "site_name", "mobile_number", "email"),
    participant_recruit = all_part %>%
      select(
        "record_id", "date_screening",
        "num_seas_vac", "eligible_extra_bleed", "add_bleed"
      ),
    participant_baseline = all_part %>%
      select(
        "record_id", "baseline_q_date",
        "a1_gender", "a2_dob", "a3_atsi", "a4_children",
        "a5_height", "a6_weight",
        "b1_medicalhx",
        "c1_yrs_employed", "c2_emp_status", "c3_occupation",
        "c3_spec", "c4_workdept",
        "c4_spec", "c5_clin_care", "d1_future_vacc", "age_screening", "bmi"
      ),
    symptom = get_tbl_symptom(raw),
    swab = get_tbl_swab(raw),
    withdrawal = get_tbl_withdrawal(raw)
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
  dat <- get_redcap_data(token, uri)
  if (identical(dat, tibble())) {
    return(dat)
  }
  dat %>%
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
