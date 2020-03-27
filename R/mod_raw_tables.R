ui_raw_tables <- function(id = "raw-tables", label = "Raw tables") {
  ns <- NS(id)
  tabPanel(
    label,
    tabsetPanel(
      type = "tabs",
      ui_raw_table(ns("participant-raw-table"), "Participant")
    )
  )
}


server_raw_tables <- function(input, output, session, data) {
  tbl_participant <- reactive(data()$participant)
  callModule(server_raw_table, "participant-raw-table", tbl_participant)
}
