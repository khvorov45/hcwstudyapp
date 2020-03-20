#' UI for plot tabs
#'
#' @param label Label for the tab
#' @param ... Additional UI to put on the sidebar
#'
#' @noRd
ui_tablepanel <- function(id, label, data_ui = list(), tbl_ui = list()) {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        data_ui,
        hr(),
        ui_varselect(ns("vars"), "Table variables"),
        shinyWidgets::pickerInput(
          ns("nrow"), "Rows per page", list("All", "100", "50", "10")
        ),
        tbl_ui,
        downloadButton(ns("download"), "Download data")
      ),
      mainPanel(
        DT::dataTableOutput(ns("table"))
      )
    )
  )
}

#' Server for plotpanel
#'
#' @noRd
server_tablepanel <- function(input, output, session, tbl,
                              data_name = "data") {
  vars <- callModule(server_varselect, "vars", tbl)
  observe({
    tbl <- tbl()
    vars <- vars()
    if (input$nrow == "All") {
      nrow <- nrow(tbl)
    } else {
      nrow <- as.numeric(input$nrow)
    }
    output$table <- table_render(tbl, vars, nrow)
  })
  output$download <- table_download(tbl, data_name)
}
