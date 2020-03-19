#' Tab with widgets to view recruitment by vaccination history
#' @noRd
ui_recruitvh <- function(id = "recruitvh", label = "Recruitment") {
  ns <- NS(id)
  plotpanel(
    ns, label,
    ui_binfilt(ns("binfilt"), "Consent to additional bleed", "add_bleed")
  )
}

#' Server for recruitvh
#'
#' @param input,output,session Standard
#' @param dat REDCap data (list of tables, subset by access group elsewhere)
#'
#' @import ggplot2
#'
#' @noRd
server_recruitvh <- function(input, output, session, dat, dark) {
  tbl <- reactive(inner_join(
    dat()$participant_recruit, dat()$participant_essential, "record_id"
  ))
  tbl_filt <- callModule(server_binfilt, "binfilt", tbl, "add_bleed")
  plotpanel_fun(
    input, output, session, tbl_filt, dark,
    plot_recruitvh,
  )
}
