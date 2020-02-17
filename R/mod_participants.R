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
  observeEvent(input$update, {
    output$table <- renderTable({all_data()$participant})
  })
}
