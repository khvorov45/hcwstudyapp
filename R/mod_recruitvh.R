#' Tab with widgets to view recruitment by vaccination history
#' @noRd
ui_recruitvh <- function(id = "recruitvh", label = "Recruitment") {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
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
  observeEvent(input$update, {
    if (is.null(password_verified())) return()
    if (!password_verified()) return()
    if (is.null(all_data())) return()
    output$plot <- renderPlot(plot_recruitvh(all_data()$participant))
  })
}
