#' Table of symptoms
#' @noRd
ui_symptoms <- function(id = "symptoms", label = "Symptoms") {
  ns <- NS(id)
  tablepanel(
    ns, label,
    dateRangeInput(
      ns("dates"), "Date range", "2020-05-04", "2020-10-12"
    ),
    shinyWidgets::radioGroupButtons(
      ns("subsetili"), "",
      list(
        "Completed surveys" = "all",
        "All records for subjects with ARI" = "sub",
        "All surveys with ARI" = "row"
      ),
      direction = "vertical",
      justified = TRUE
    ),
    binfilt(ns, "Swabs")
  )
}

#' Server for symptoms
#'
#' @inheritParams server_recruitvh
#'
#' @noRd
server_symptoms <- function(input, output, session, redcap_data) {

  # Join surveys to contact to swab
  tbl <- reactive({
    inner_join(
      redcap_data()$symptom,
      redcap_data()$participant,
      "record_id"
    ) %>%
      left_join(
        rename(redcap_data()$swab, date_symptom_survey = .data$survey_week),
        c("record_id", "date_symptom_survey")
      ) %>%
      select("record_id", "pid", "site_name", everything())
  })

  # Standard table panel
  update_tablepanel_dyn(session, tbl)

  # Update dates to min/max
  observe({
    sympt <- redcap_data()$symptom
    updateDateRangeInput(
      session, "dates",
      start = min(sympt$date_symptom_survey, na.rm = TRUE),
      end = max(sympt$date_symptom_survey, na.rm = TRUE)
    )
  })

  # Filter by date
  tbl_fdate <- reactive({
    filter(
      tbl(),
      .data$date_symptom_survey >= input$dates[[1]],
      .data$date_symptom_survey <= input$dates[[2]],
    )
  })

  # Filter by ARI
  tbl_fili <- reactive({
    if (input$subsetili == "all") {
      tbl_fdate()
    } else if (input$subsetili == "sub") {
      subs <- tbl_fdate()
      sub_ili <- subs %>%
        group_by(.data$record_id) %>%
        filter(any(.data$ari_definition == 1L)) %>%
        ungroup() %>%
        pull(.data$record_id)
      filter(subs, .data$record_id %in% sub_ili)
    } else {
      filter(tbl_fdate(), .data$ari_definition == 1L)
    }
  })

  # Filter by swab
  tbl_fswab <- reactive({
    mutate(
      tbl_fili(),
      swab_collection_2 = if_else(
        is.na(.data$swab_collection), "Missing", .data$swab_collection
      )
    ) %>%
      filter(.data$swab_collection_2 %in% input$subsetswab) %>%
      select(-"swab_collection_2")
  })

  # Render
  tbl_new <- update_tbl_dyn(input, tbl_fswab)
  render_tablepanel_table(output, tbl_new)

  # Download
  output$download <- download_data(output, "symptoms", tbl_new)
}
