#' Table of participants and their contact information
#' @noRd
ui_participants <- function(id = "participants", label = "Participants") {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site")),
        #shinyWidgets::prettyCheckbox(ns("varnames"), "Variable names"),
        varselect(ns("vars"))
      ),
      mainPanel(
        DT::dataTableOutput(ns("table"))
      )
    )
  )
}

#' Server for participants
#'
#' @inheritParams server_recruitvh
#'
#' @importFrom rlang !!
#'
#' @noRd
server_participants <- function(input, output, session, dat) {
  update_siteselect_dyn(session, "site", dat)
  update_varselect_dyn(session, "vars", reactive(dat()$participant))

  tbl_filtered <- filter_siteselect_dyn(
    reactive(input$site), reactive(dat()$participant)
  )
  tbl_selected <- select_vars_dyn(
    reactive(input$vars), tbl_filtered
  )

  observe({
    tbl <- tbl_selected()
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
