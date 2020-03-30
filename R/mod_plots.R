ui_plots <- function(id = "plots", label = "Plots") {
  ns <- NS(id)
  tabPanel(
    label,
    fluidRow(
      column(4, ui_binfilt(
        ns("binfilt-addb"), "Consent to additional bleed", "add_bleed"
      )),
      column(4, ui_bqcomp(ns("bqcomp")))
    ),
    fluidRow(
      column(4, sliderInput(ns("fontsize"), "Font size", 10, 30, 20))
    ),
    fluidRow(
      column(
        6,
        plotOutput(ns("histvachx"))
      )
    )
  )
}

server_plots <- function(input, output, session, data, dark) {
  tbl_part <- reactive(data()$participant)
  tbl_part_addb <- callModule(
    server_binfilt, "binfilt-addb", tbl_part, "add_bleed"
  )
  tbl_part_bq <- callModule(server_bqcomp, "bqcomp", tbl_part)
  output$histvachx <- renderPlot(
    plot_vachx(tbl_part_addb(), input$fontsize, dark())
  )
}
