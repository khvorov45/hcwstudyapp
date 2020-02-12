#' Tab with widgets to select a table
#' @noRd
tabseltable <- function(id = "seltable", label = "Select table") {
  tabPanel(
    label,
    seltable(id),
    updatebutton(id)
  )
}

server_seltable <- function(input, output, session, password_verified) {
  observeEvent(input$updatebutton, {
    if (is.null(password_verified())) return()
    if (!password_verified()) return()
    all_dat <- down_trans_redcap(golem::get_golem_options("token"))
    print(all_dat)
  })
}
