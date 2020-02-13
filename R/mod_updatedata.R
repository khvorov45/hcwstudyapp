#' Button to update data
#' @noRd
ui_updatedata <- function(id = "updatedata", label = "Update data") {
  ns <- NS(id)
  updatebutton(ns("update"), label)
}

server_updatedata <- function(input, output, session, password_verified) {
  all_dat <- reactiveVal()
  observeEvent(input$update, {
    if (is.null(password_verified())) return()
    if (!password_verified()) return()
    all_dat(down_trans_redcap(golem::get_golem_options("token")))
  })
  all_dat
}
