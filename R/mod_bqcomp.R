ui_bqcomp <- function(id) {
  ns <- NS(id)
  shinyWidgets::radioGroupButtons(
    ns("qmiss"), "Questionnaire completeness",
    list("Any", "Complete", "Incomplete"),
    direction = "horizontal"
  )
}

server_bqcomp <- function(input, output, session, part_tbl) {
  reactive({
    tbl <- part_tbl()
    if (input$qmiss == "Any") {
      return(tbl)
    }
    complete_ids <- tbl %>%
      select(
        "record_id", "a1_gender", "a2_dob", "a3_atsi", "a4_children",
        "a5_height", "a6_weight",
        "b1_medicalhx",
        "c1_yrs_employed", "c2_emp_status", "c3_occupation",
        "c4_workdept",
        "c5_clin_care", "d1_future_vacc"
      ) %>%
      mutate_all(as.character) %>%
      tidyr::pivot_longer(
        -"record_id",
        names_to = "question", values_to = "response"
      ) %>%
      group_by(.data$record_id) %>%
      summarise(complete_status = all(!is.na(.data$response))) %>%
      filter(.data$complete_status) %>%
      pull(.data$record_id)
    if (input$qmiss == "Complete") {
      filter(tbl, .data$record_id %in% complete_ids)
    } else {
      filter(tbl, !.data$record_id %in% complete_ids)
    }
  })
}
