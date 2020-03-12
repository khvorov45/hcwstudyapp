#' UI for plot tabs
#'
#' @param ns Namespace function
#' @param label Label for the tab
#' @param ... Additional UI to put on the sidebar
#'
#' @noRd
plotpanel <- function(ns, label, ...) {
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site")),
        ...,
        sliderInput(ns("fontsize"), "Plot font size", 10, 30, 20)
      ),
      mainPanel(
        plotOutput(ns("plot"))
      )
    )
  )
}

#' Functional part of the plotpanel
#'
#' @param tbl Reactive table to start with
#' @param process_fun Function to do additional processing on tbl
#'
#' @noRd
plotpanel_fun <- function(input, output, session, tbl, dark, plot_fun,
                          process_fun, plot_fun_args = list()) {
  update_siteselect_dyn(session, "site", tbl)
  sitefilt <- filter_siteselect_dyn(reactive(input$site), tbl)
  fullfilt <- process_fun(sitefilt)
  output$plot <- renderPlot({
    do.call(
      plot_fun,
      c(list(fullfilt(), input$fontsize, dark()), plot_fun_args)
    )
  })
}
