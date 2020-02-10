#' Input for the RedCap API password
#' @noRd
token <- function(id, label = "") {
  ns <- NS(id)
  passwordInput(
    ns("token"),
    label,
    value = process_token("token")
  )
}
