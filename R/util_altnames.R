workdept_altnames <- c(
  "1" = "Emergency Department",
  "2" = "Critical Care or Intensive Care Unit",
  "3" = "General Medicine and/or Medical Specialities",
  "4" = "Paediatrics and/or Paediatric Specialities",
  "5" = "Surgery and/or Surgical Specialties",
  "6" = "Gynaecology and/or Obstetrics",
  "7" = "Oncology and/or Haematology",
  "8" = "Radiology",
  "9" = "Outpatient clinic",
  "10" = "Pharmacy",
  "11" = "Laboratory",
  "12" = "Nutrition",
  "13" = "Social Work",
  "14" = "Physiotherapy",
  "15" = "Occupational therapy",
  "16" = "Other"
)

#' Alternative variable names
var_altnames <- c(
  "record_id" = "Record ID",
  "pid" = "PID",
  "site_name" = "Site",
  "num_seas_vac" = "Seasons vaccinated",
  "eligible_extra_bleed" = "Eligible for extra bleed",
  "mobile_number" = "Mobile",
  "email" = "Email"
)

#' Access group names
site_altnames <- c(
  "adelaide" = "Women and Children's Hospital Adelaide",
  "brisbane" = "Queensland Children's Hospital",
  "melbourne" = "Alfred Hospital",
  "newcastle" = "John Hunter Hospital",
  "perth" = "Perth Children's Hospital",
  "sydney" = "Children's Hospital Westmead",
  "(Missing)" = "(Missing)"
)

#' Names for options in the medical history
medicalhx_altnames <- c(
  "1" = "Cardiac disease",
  "2" = "Renal disiase",
  "3" = "Chronic respiratory condition",
  "4" = "Haemotological disorder",
  "5" = "Pregnancy",
  "6" = "Immunocompromising condition",
  "7" = "Diabetes or other metabolic disorder",
  "8" = "Smoker",
  "9" = "None"
)

#' Names for options in swab results
swabres_altnames <- c(
  "1" = "Influenza A (unsubtyped)",
  "2" = "Influenza A H3",
  "3" = "Influenza A H1",
  "4" = "Influenza B (no lineage)",
  "5" = "Influenza B Vic",
  "6" = "Influenza B Yam",
  "7" = "Influenza C",
  "8" = "Parainfluenza",
  "9" = "Human metapneumovirus",
  "10" = "Picornavirus",
  "11" = "Adenovirus",
  "12" = "Coronavirus",
  "13" = "Other",
  "14" = "Negative"
)

#' Returns the site name given the access group
#'
#' @param access_group Access group, should be one of the names in
#'   `site_altnames`
#'
#' @noRd
get_site_name <- function(access_group) {
  if (!access_group %in% names(site_altnames)) {
    rlang::abort(
      glue::glue("access group '{access_group}' not recognised"),
      class = "unknown_access_group"
    )
  }
  site_altnames[names(site_altnames) == access_group][[1]]
}
