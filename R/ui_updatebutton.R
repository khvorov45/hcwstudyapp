#' Button to update the output
#' @noRd
updatebutton <- function(id, label = "Update") {
  ns <- NS(id)
  actionButton(
    ns("updatebutton"),
    label
  )
}
