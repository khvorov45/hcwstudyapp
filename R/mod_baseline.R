#' Baseline characteristice
#' @noRd
ui_baseline <- function(id = "baseline", label = "Baseline") {
  ns <- NS(id)
  ui_plotpanel(
    ns("plotpanel"), label,
    plot_ui = list(
      shinyWidgets::pickerInput(
        ns("var_lab"), "Plot variable",
        list("Gender", "Age")
      )
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
  tbl <- reactive(inner_join(
    dat()$participant_essential,
    dat()$participant_baseline,
    "record_id"
  ))
  observe({
    var_lab <- input$var_lab
    callModule(
      server_plotpanel, "plotpanel", tbl, dark, plot_hist,
      reactiveValues(var_lab = var_lab),
      data_name = "baseline"
    )
  })
}
