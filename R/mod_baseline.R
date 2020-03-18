#' Baseline characteristice
#' @noRd
ui_baseline <- function(id = "baseline", label = "Baseline") {
  ns <- NS(id)
  tabPanel(
    label,
    tabsetPanel(
      type = "tabs",
      plotpanel(
        ns, "Histograms",
        shinyWidgets::pickerInput(
          ns("var_lab"), "Variable",
          list("Gender", "Age")
        )
      ),
      tablepanel(
        ns, "Questionnaire"
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
    plotpanel_fun(
      input, output, session, tbl, dark,
      plot_hist,
      function(tbl) {
        tbl
      },
      list(
        var_lab = var_lab
      )
    )
  })
  update_tablepanel_dyn(session, tbl)
  tbl_new <- update_tbl_dyn(input, tbl)
  render_tablepanel_table(output, tbl_new)
  output$download <- download_data(output, "baseline_questionnaire", tbl_new)
}
