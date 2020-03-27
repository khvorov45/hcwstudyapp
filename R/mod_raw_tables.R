ui_raw_tables <- function(id = "raw-tables", label = "Raw tables") {
  ns <- NS(id)
  tabPanel(
    label,
    tabsetPanel(
      type = "tabs",
      ui_raw_participant(ns("raw-participant"), "Participants"),
      ui_raw_symptom(ns("raw-symptom"), "Symptom surveys"),
      ui_raw_swab(ns("raw-swab"), "Swabs")
    )
  )
}


server_raw_tables <- function(input, output, session, data) {
  callModule(server_raw_participant, "raw-participant", data)
  callModule(server_raw_symptom, "raw-symptom", data)
  callModule(server_raw_swab, "raw-swab", data)
}
