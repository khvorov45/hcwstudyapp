#' Table of participants and their contact information
#' @noRd
ui_participants <- function(id = "participants", label = "Participants") {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site"))
      ),
      mainPanel(
        tableOutput(ns("table"))
      )
    )
  )
}

server_participants <- function(input, output, session,
                                password_verified, all_data) {
  update_siteselect_dyn(session, "site", password_verified, all_data)

  # Update on update button press
  observe({
    if (!canexec(password_verified(), all_data())) return()
    subs <- all_data()$participant
    if (input$site != "All") {
      subs <- filter(subs, .data$site_name == input$site) %>%
        select(-"site_name")
    }
    output$table <- renderTable({subs})
  })
}
