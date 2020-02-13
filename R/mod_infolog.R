#' UI for infolog
#' @noRd
ui_infolog <- function(id = "infolog") {
  ns <- NS(id)
  textOutput(ns("infolog"))
}

#' Server for the infolog
#' @noRd
server_infolog <- function(input, output, session) {
  output$infolog <- renderText({""})
}
