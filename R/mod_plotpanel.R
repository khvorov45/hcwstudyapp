#' UI for plot tabs
#'
#' @param label Label for the tab
#' @param ... Additional UI to put on the sidebar
#'
#' @noRd
ui_plotpanel <- function(id, label, data_ui = list(),
                         plot_ui = list(), tbl_ui = list()) {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        data_ui,
        hr(),
        plot_ui,
        sliderInput(ns("fontsize"), "Plot font size", 10, 30, 20),
        hr(),
        ui_varselect(ns("vars"), "Data table variables"),
        shinyWidgets::pickerInput(
          ns("nrow"), "Rows per page", list("All", "100", "50", "10")
        ),
        tbl_ui,
        downloadButton(ns("download"), "Download data")
      ),
      mainPanel(
        tabsetPanel(
          type = "tabs",
          tabPanel("Plot", plotOutput(ns("plot"))),
          tabPanel("Table", tableOutput(ns("table"))),
          tabPanel("Data", DT::dataTableOutput(ns("data")))
        )
      )
    )
  )
}

#' Server for plotpanel
#'
#' @noRd
server_plotpanel <- function(input, output, session, tbl, dark,
                             plot_fun, table_html,
                             plot_fun_args = reactiveValues(),
                             data_name = "data") {
  vars <- callModule(server_varselect, "vars", tbl)
  output$plot <- renderPlot({
    do.call(
      plot_fun,
      c(
        list(tbl(), input$fontsize, dark()),
        reactiveValuesToList(plot_fun_args)
      )
    )
  })
  output$table <- function() table_html()
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
  output$download <- table_download(tbl, data_name)
}
