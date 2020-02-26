#' Table of participants and their contact information
#' @noRd
ui_participants <- function(id = "participants", label = "Participants") {
  ns <- NS(id)
  tablepanel(ns, label)
}

#' Server for participants
#'
#' @inheritParams server_recruitvh
#'
#' @importFrom rlang !!
#'
#' @noRd
server_participants <- function(input, output, session, dat) {
  tbl <- reactive(dat()$participant)
  update_tablepanel_dyn(session, tbl)
  tbl_new <- update_tbl_dyn(input, tbl)
  render_tablepanel_table(output, tbl_new)
}
