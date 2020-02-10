#' Input for the RedCap API password
#' @noRd
apipass <- function(id, label = "") {
  ns <- NS(id)
  passwordInput(
    ns("apipass"),
    label,
    value = process_apipass(golem::get_golem_options("token"))
  )
}
