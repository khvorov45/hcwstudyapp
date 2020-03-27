ui_raw_table <- function(id, label) {
  ns <- NS(id)
  tabPanel(
    label,
    br(),
    fluidRow(
      column(4, ui_varselect(ns("vars"), "Variables")),
      column(4, shinyWidgets::pickerInput(
        ns("nrow"), "Rows per page", list("All", "100", "50", "10")
      ))
    ),
    DT::dataTableOutput(ns("data"))
  )
}

server_raw_table <- function(input, output, session, tbl) {
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
}
