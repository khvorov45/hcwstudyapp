#' Table of participants and their contact information
#' @noRd
ui_participants <- function(id = "participants", label = "Contact") {
  ns <- NS(id)
  ui_tablepanel(ns("tablepanel"), label)
}

#' Server for participants
#'
#' @inheritParams server_recruitvh
#'
#' @importFrom rlang !!
#'
#' @noRd
server_participants <- function(input, output, session, dat) {
  tbl <- reactive(dat()$participant_essential)
  callModule(server_tablepanel, "tablepanel", tbl, "contact")
}
