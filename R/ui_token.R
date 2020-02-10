#' Input for the RedCap API token
#' @noRd
token <- function(id, label = "") {
  ns <- NS(id)
  textInput(
    ns("token"),
    label,
    value = process_token("token")
  )
}
