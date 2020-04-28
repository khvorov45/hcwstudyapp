ui_raw_table <- function(id, label, ...) {
  ns <- NS(id)
  tabPanel(
    label,
    br(),
    fluidPage(
      fluidRow(
        column(3, ui_varselect(ns("vars"), "Variables")),
        column(3, downloadButton(ns("download"), "Download"))
      ),
      ...,
      tableOutput(ns("data"))
    )
  )
}

server_raw_table <- function(input, output, session, tbl, data_name) {
  vars <- callModule(server_varselect, "vars", tbl)
  observe({
    tbl <- tbl()
    vars <- vars()
    output$data <- function() table_simple_html(tbl, vars)
  })
  output$download <- table_download(tbl, data_name)
}
