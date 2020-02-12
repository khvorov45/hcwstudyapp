#' Tab with widgets to select a table
#' @noRd
tabseltable <- function(id = "seltable", label = "Select table") {
  tabPanel(
    label,
    seltable(id),
    updatebutton(id)
  )
}

server_seltable <- function(input, output, session) {
  observeEvent(input$updatebutton, {
  })
}
