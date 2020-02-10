#' Tab to input RedCap API token
#' @noRd
tabtoken <- function(label = "Token") {
  tabPanel(
    label,
    token("tabtoken")
  )
}
