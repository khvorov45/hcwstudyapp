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

#' Dynamically updates the above
#'
#' @param session From server
#' @param tbl Reactive data
#'
#' @noRd
update_tablepanel_dyn <- function(session, tbl) {
  update_siteselect_dyn(session, "site", tbl)
  update_varselect_dyn(session, "vars", tbl)
}

#' Dynamically changes the input according to the above inputs
#'
#' @param input From server
#' @param tbl Reactive data
#'
#' @noRd
update_tbl_dyn <- function(input, tbl) {
  tbl_filtered <- filter_siteselect_dyn(reactive(input$site), tbl)
  select_vars_dyn(reactive(input$vars), tbl_filtered)
}

#' Renders the output table
#'
#' @param output From server
#' @param tbl Reactive data
#'
#' @noRd
render_tablepanel_table <- function(output, tbl) {
  observe({
    tbl <- tbl()
    output$table <- DT::renderDataTable(
      tbl,
      style = "bootstrap4",
      rownames = FALSE,
      options = list(
        dom = "t",
        columnDefs = list(
          list(className = 'dt-center', targets = 1:ncol(tbl) - 1)
        ),
        scrollX = TRUE
      )
    )
  })
}
