#' Table of participants and their contact information
#' @noRd
ui_participants <- function(id = "participants", label = "Participants") {
  ns <- NS(id)
  tabPanel(
    label,
    sidebarLayout(
      sidebarPanel(
        siteselect(ns("site")),
        updatebutton(ns("update"), "Update table")
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
  observeEvent(input$update, {
    if (!canexec(password_verified(), all_data())) return()
    output$table <- renderTable({all_data()$participant})
  })
}
