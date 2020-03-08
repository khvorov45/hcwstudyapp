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
  "sydney" = "Children's Hospital Westmead"
)

#' Returns the site name given the access group
#'
#' @param access_group Access group, should be one of the names in
#'   `site_altnames`
#'
#' @noRd
get_site_name <- function(access_group) {
  if (!access_group %in% names(site_altnames))
    rlang::abort(glue::glue("access group '{access_group}' not recognised"))
  site_altnames[names(site_altnames) == access_group][[1]]
}
