ui_plots <- function(id = "plots", label = "Plots") {
  ns <- NS(id)
  tabPanel(
    label,
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
  output$histvachx <- renderPlot(
    plot_recruitvh(data()$participant, input$fontsize, dark())
  )
}
