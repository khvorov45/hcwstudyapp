ui_raw_table <- function(id, label) {
  ns <- NS(id)
  tabPanel(
    label,
    br(),
    fluidRow(
      column(3, ui_varselect(ns("vars"), "Variables")),
      column(3, shinyWidgets::pickerInput(
        ns("nrow"), "Rows per page", list("All", "100", "50", "10")
      )),
      column(3, downloadButton(ns("download"), "Download"))
    ),
    DT::dataTableOutput(ns("data"))
  )
}

server_raw_table <- function(input, output, session, tbl, data_name) {
  vars <- callModule(server_varselect, "vars", tbl)
  observe({
    tbl <- tbl()
    vars <- vars()
    if (input$nrow == "All") {
      nrow <- nrow(tbl)
    } else {
      nrow <- as.numeric(input$nrow)
    }
    output$data <- table_render(tbl, vars, nrow)
  })
  observe({
    print(tbl())
    print(data_name)
  })
  output$download <- table_download(tbl, data_name)
}
