#' Table of symptoms
#' @noRd
ui_symptoms <- function(id = "symptoms", label = "Symptoms") {
  ns <- NS(id)
  tablepanel(
    ns, label,
    sliderInput(ns("dates"), "Date range", 0, 100, c(20, 80))
  )
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
  tbl_new <- update_tbl_dyn(input, tbl)
  render_tablepanel_table(output, tbl_new)
}
