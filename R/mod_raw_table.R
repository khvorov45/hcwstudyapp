ui_raw_table <- function(id, label, ...) {
  ns <- NS(id)
  tabPanel(
    label,
    br(),
    fluidPage(
      fluidRow(
        column(3, ui_varselect(ns("vars"), "Variables")),
        column(3, shinyWidgets::pickerInput(
          ns("arrange_by"), "Arrange by", list()
        )),
        column(3, downloadButton(ns("download"), "Download"))
      ),
      ...,
      tableOutput(ns("data"))
    )
  )
}

server_raw_table <- function(input, output, session, tbl, data_name) {
  vars <- callModule(server_varselect, "vars", tbl)
  observe(shinyWidgets::updatePickerInput(
    session, "arrange_by",
    choices = colnames(tbl())
  ))
  observe({
    tbl <- tbl()
    vars <- vars()
    if (!is.null(input$arrange_by)) {
      if (input$arrange_by %in% colnames(tbl))
        tbl <- arrange(tbl, !!rlang::sym(input$arrange_by))
    }
    if (!is.null(vars)) tbl <- tbl[vars]
    output$data <- function() table_simple_html(tbl)
  })
  output$download <- table_download(tbl, data_name)
}
