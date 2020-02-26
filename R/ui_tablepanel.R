#' UI for table tabs
#'
#' @param ns Namespace function
#' @param label Label for the tab
#' @param ... Additional UI to put on the sidebar
#'
#' @noRd
tablepanel <- function(ns, label, ...) {
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site")),
        varselect(ns("vars")),
        ...
      ),
      mainPanel(
        DT::dataTableOutput(ns("table"))
      )
    )
  )
}
