#' Table of symptoms
#' @noRd
ui_symptoms <- function(id = "symptoms", label = "Symptoms") {
  ns <- NS(id)
  tablepanel(
    ns, label,
    dateRangeInput(
      ns("dates"), "Date range", "2020-05-04", "2020-10-12"
    )
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

  tbl_fdate <- reactive({
    filter(
        tbl(),
        .data$date_symptom_survey >= input$dates[[1]],
        .data$date_symptom_survey <= input$dates[[2]],
      )
  })

  tbl_new <- update_tbl_dyn(input, tbl_fdate)
  render_tablepanel_table(output, tbl_new)
}
