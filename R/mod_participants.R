#' Table of participants and their contact information
#' @noRd
ui_participants <- function(id = "participants", label = "Participants") {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site")),
        shinyWidgets::prettyCheckbox(ns("varnames"), "Variable names"),
        varselect(ns("vars"))
      ),
      mainPanel(
        DT::dataTableOutput(ns("table"))
      )
    )
  )
}

#' @importFrom rlang !!
server_participants <- function(input, output, session,
                                password_verified, all_data) {
  update_siteselect_dyn(session, "site", password_verified, all_data)

  part_tbl <- update_varselect_dyn(
    session, "vars", password_verified, all_data, "participant",
    input, "varnames"
  )

  observe({
    if (!canexec(password_verified(), all_data())) return()
    subs <- part_tbl()

    # Site filter
    if (input$site != "All") {
      if (input$varnames) siten <- "site_name"
      else siten <- "Site"
      subs <- filter(subs, !!rlang::sym(siten) == input$site) %>%
        select(-!!rlang::sym(siten))
    }

    # Column selection
    if (!is.null(input$vars)) {
      subs <- subs[colnames(subs) %in% input$vars]
    }

    # Filter all missing
    subs <- subs[apply(subs, 1, function(vec) any(!is.na(vec))), ]

    output$table <- DT::renderDataTable(
      {subs}, style = "bootstrap4",
      rownames = FALSE,
      options = list(
        dom = "t",
        columnDefs = list(
          list(className = 'dt-center', targets = 1:ncol(subs) - 1)
        ),
        scrollX = TRUE
      )
    )
  })
}
