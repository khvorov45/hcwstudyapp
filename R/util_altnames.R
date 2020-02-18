#' Recodes variable names
#' @noRd
altnames <- function(ognames) {
  recode(
    ognames,
    "record_id" = "Record ID",
    "pid" = "PID",
    "site_name" = "Site",
    "num_seas_vac" = "Seasons vaccinated",
    "eligible_extra_bleed" = "Eligible for extra bleed",
    "first_name" = "First name",
    "surname" = "Last name",
    "mobile_number" = "Mobile",
    "email" = "Email"
  )
}
