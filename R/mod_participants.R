#' Table of participants and their contact information
#' @noRd
ui_participants <- function(id = "participants", label = "Participants") {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site")),
        shinyWidgets::prettyCheckbox(ns("varnames"), "Variable names")
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

  # Update on update button press
  observe({
    if (!canexec(password_verified(), all_data())) return()
    subs <- all_data()$participant
    og_names <- names(subs)
    new_names <- recode(
      og_names,
      "record_id" = "Record ID",
      "pid" = "PID",
      "site_name" = "Site",
      "num_seas_vac" = "Seasons vaccinated",
      "eligible_extra_bleed" = "Eligible for extra bleed",
      "first_name" = "First name",
      "surname" = "Last name",
      "mobile_number" = "Mobile",
      "email" = "Email"
    )
    if (!input$varnames) names(subs) <- new_names
    if (input$site != "All") {
      if (input$varnames) siten <- "site_name"
      else siten <- "Site"
      subs <- filter(subs, !!rlang::sym(siten) == input$site) %>%
        select(-!!rlang::sym(siten))
    }
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
