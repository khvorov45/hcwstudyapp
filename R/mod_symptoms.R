#' Table of symptoms
#' @noRd
ui_symptoms <- function(id = "symptoms", label = "Symptoms") {
  ns <- NS(id)
  tablepanel(ns, label)
}

#' Server for symptoms
#'
#' @inheritParams server_recruitvh
#'
#' @noRd
server_symptoms <- function(input, output, session, redcap_data) {
  tbl <- reactive({
    inner_join(
      redcap_data()$symptom,
      redcap_data()$participant,
      "record_id"
    ) %>%
      select("record_id", "pid", "site_name", everything())
  })
  update_tablepanel_dyn(session, tbl)
  observe({print(tbl())})
}
