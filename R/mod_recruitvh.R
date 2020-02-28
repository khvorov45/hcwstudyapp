#' Tab with widgets to view recruitment by vaccination history
#' @noRd
ui_recruitvh <- function(id = "recruitvh", label = "Recruitment") {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site")),
        sliderInput(ns("fontsize"), "Plot font size", 10, 30, 20)
      ),
      mainPanel(
        plotOutput(ns("plot"))
      )
    ),
  )
}

#' Server for recruitvh
#'
#' @param input,output,session Standard
#' @param dat REDCap data (list of tables, subset by access group elsewhere)
#'
#' @import ggplot2
#'
#' @noRd
server_recruitvh <- function(input, output, session, dat, dark) {
  update_siteselect_dyn(session, "site", dat)

  # Add a factor for x on data change
  dat_plot <- eventReactive(dat(), {
    dat()$participant %>%
      dplyr::mutate(
        num_seas_vac_fct = factor(.data$num_seas_vac, levels = 0:5)
      )
  })

  # Filter on site change
  dat_plot_filt <- filter_siteselect_dyn(reactive(input$site), dat_plot)

  output$plot <- renderPlot({
    plot_recruitvh(dat_plot_filt(), input$fontsize, dark())
  })
}
