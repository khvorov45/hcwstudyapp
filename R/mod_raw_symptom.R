ui_raw_symptom <- function(id, label) {
  ns <- NS(id)
  ui_raw_table(
    ns("symptom-raw-table"), label,
    fluidRow(
      column(3, dateRangeInput(
        ns("dates"), "Date range", "2020-05-04", "2020-10-12"
      )),
      column(4, shinyWidgets::radioGroupButtons(
        ns("subsetili"), "",
        list(
          "Completed surveys" = "all",
          "All records for subjects with ARI" = "sub",
          "All surveys with ARI" = "row"
        ),
        direction = "vertical",
        justified = TRUE
      )),
      column(3, ui_binfilt(
        ns("binfilt"), "Swab collection", "swab_collection"
      ))
    )
  )
}

server_raw_symptom <- function(input, output, session, data) {

  # Join surveys to contact to swab
  tbl <- reactive({
    inner_join(
      data()$symptom,
      data()$participant_essential,
      "record_id"
    ) %>%
      left_join(
        rename(data()$swab, date_symptom_survey = .data$survey_week),
        c("record_id", "date_symptom_survey")
      ) %>%
      select("record_id", "pid", "site_name", everything())
  })

  # Update dates to min/max
  observe({
    sympt <- data()$symptom
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
  tbl_fswab <- callModule(
    server_binfilt, "binfilt", tbl_fili, "swab_collection"
  )
  callModule(
    server_raw_table, "symptom-raw-table", tbl_fswab, "symptom"
  )
}
