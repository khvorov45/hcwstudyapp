#' Baseline characteristice
#' @noRd
ui_baseline <- function(id = "baseline", label = "Baseline") {
  ns <- NS(id)
  plotpanel(
    ns, label,
    shinyWidgets::pickerInput(
      ns("var_lab"), "Variable",
      list("Gender", "Age")
    )
  )
}

#' Server for baseline
#'
#' @inheritParams server_recruitvh
#'
#' @importFrom rlang !!
#'
#' @noRd
server_baseline <- function(input, output, session, dat, dark) {
  observe({
    var_lab <- input$var_lab
    plotpanel_fun(
      input, output, session, reactive(dat()$participant), dark,
      plot_hist,
      function(tbl) {
        tbl
      },
      list(
        var_lab = var_lab
      )
    )
  })
}
