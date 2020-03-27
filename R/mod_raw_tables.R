ui_raw_tables <- function(id = "raw-tables", label = "Raw tables") {
  ns <- NS(id)
  tabPanel(
    label,
    tabsetPanel(
      type = "tabs",
      ui_raw_table(ns("participant-raw-table"), "Participants"),
      ui_raw_table(ns("symptom-raw-table"), "Symptom surveys"),
      ui_raw_table(ns("swab-raw-table"), "Swabs")
    )
  )
}


server_raw_tables <- function(input, output, session, data) {
  callModule(
    server_raw_table, "participant-raw-table",
    reactive(data()$participant), "participant"
  )
  callModule(
    server_raw_table, "symptom-raw-table", reactive(data()$symptom), "symptom"
  )
  callModule(
    server_raw_table, "swab-raw-table", reactive(data()$swab), "swab"
  )
}
