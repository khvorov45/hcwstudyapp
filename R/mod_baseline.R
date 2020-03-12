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
          ns("var_name"), "Variable", list("a1_gender")
        )
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
  plotpanel_fun(
    input, output, session, reactive(dat()$participant), dark,
    plot_hist,
    function(tbl) {
      tbl
    },
    list(
      var_name = input$var_name
    )
  )
}
