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
        ...,
        downloadButton(ns("download"), "Download")
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
#' Expected to be the last table processign step before render. Removes empty
#' rows and duplicates.
#'
#' @param input From server
#' @param tbl Reactive data
#'
#' @noRd
update_tbl_dyn <- function(input, tbl) {
  tbl_filtered <- filter_siteselect_dyn(reactive(input$site), tbl)
  tbl_selected <- select_vars_dyn(reactive(input$vars), tbl_filtered)
  # Remove rows with all missing
  reactive({
    subs <- tbl_selected() %>% unique()
    subs[apply(subs, 1, function(vec) any(!is.na(vec))), ]
  })
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
        dom = "pt",
        columnDefs = list(
          list(className = "dt-center", targets = 1:ncol(tbl) - 1)
        ),
        scrollX = TRUE
      )
    )
  })
}

#' Lets user download data
#'
#' @param output From server
#' @param name Name to give to the dataset
#' @param data Reactive data
#'
#' @noRd
download_data <- function(output, name, data) {
  output$download <- downloadHandler(
    filename = function() {
      glue::glue("{name}.csv")
    },
    content = function(file) {
      readr::write_csv(data(), file)
    }
  )
}
