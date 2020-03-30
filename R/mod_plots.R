ui_plots <- function(id = "plots", label = "Plots") {
  ns <- NS(id)
  tabPanel(
    label,
    fluidRow(
      column(4, ui_binfilt(
        ns("binfilt-addb"), "Consent to additional bleed", "add_bleed"
      ))
    ),
    fluidRow(
      column(4, sliderInput(ns("fontsize"), "Font size", 10, 30, 20))
    ),
    fluidRow(
      column(6, plotOutput(ns("histvachx")))
    ),
    fluidRow(
      column(6, plotOutput(ns("agehist"))),
      column(6, plotOutput(ns("sexhist")))
    )
  )
}

server_plots <- function(input, output, session, data, dark) {
  tbl_part <- reactive(data()$participant)
  tbl_part_addb <- callModule(
    server_binfilt, "binfilt-addb", tbl_part, "add_bleed"
  )
  output$histvachx <- renderPlot(
    plot_vachx(tbl_part_addb(), input$fontsize, dark())
  )
  output$agehist <- renderPlot(
    plot_hist(
      tbl_part_addb(), input$fontsize, dark(), "age_screening",
      "Age at screening", "Count"
    )
  )
  output$sexhist <- renderPlot({
    tbl_part_addb() %>%
      mutate(
        gender_fct = factor(.data$a1_gender, c("Male", "Female")) %>%
          forcats::fct_explicit_na()
      ) %>%
      count(.data$gender_fct) %>%
      plot_col(
        input$fontsize, dark(),
        "gender_fct", "n", "Gender", "Number recruited"
      )
  })
}
