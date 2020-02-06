#' Input for the amount of rows to be printed
#' @noRd
nrowprint <- function(id, label = "Max printed rows") {
  ns <- NS(id)
  numericInput(
    ns("nrowprint"),
    label,
    min = 1,
    value = 10
  )
}
