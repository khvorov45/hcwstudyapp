#' Tab with widgets to view recruitment by vaccination history
#' @noRd
ui_recruitvh <- function(id = "recruitvh", label = "Recruitment") {
  ns <- NS(id)
  plotpanel(
    ns, label,
    binfilt(ns("filteraddb"), "Consent to additional bleeds")
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
  plotpanel_fun(
    input, output, session, reactive(dat()$participant), dark,
    plot_recruitvh,
    function(tbl) {
      binfilt_fun(
        tbl, reactive(input$filteraddb), "add_bleed"
      )
    }
  )
}
