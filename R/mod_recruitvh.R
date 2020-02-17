#' Tab with widgets to view recruitment by vaccination history
#' @noRd
ui_recruitvh <- function(id = "recruitvh", label = "Recruitment") {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site")),
        sliderInput(ns("fontsize"), "Plot font size", 10, 30, 20),
        updatebutton(ns("update"), "Update plot")
      ),
      mainPanel(
        plotOutput(ns("plot"))
      )
    ),
  )
}

#' Server for recruitvh
#'
#' @param password_verified Reactive value returned by apipass
#'
#' @import ggplot2
#'
#' @noRd
server_recruitvh <- function(input, output, session,
                             password_verified, all_data) {
  update_siteselect_dyn(session, "site", password_verified, all_data)

  # Update only plot on update button press
  observeEvent(input$update, {
    if (!canexec(password_verified(), all_data())) return()
    subs <- all_data()$participant %>%
      dplyr::mutate(
        num_seas_vac_fct = factor(.data$num_seas_vac, levels = 0:5)
      )
    if (input$site != "All") {
      subs <- dplyr::filter(subs, .data$site_name == input$site)
    }
    output$plot <- renderPlot(plot_recruitvh(subs, isolate(input$fontsize)))
  })
}
