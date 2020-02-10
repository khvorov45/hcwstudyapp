#' Tab to input RedCap API token
#' @noRd
tabapipass <- function(label = "Password") {
  tabPanel(
    label,
    apipass("tabapipass")
  )
}
