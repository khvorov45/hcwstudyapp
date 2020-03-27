ui_raw_swab <- function(id, label) {
  ns <- NS(id)
  ui_raw_table(
    ns("swab-raw-table"), label,
    fluidRow(
      column(3, shinyWidgets::prettyCheckbox(ns("orphan"), "Orphan")),
      column(9, HTML(
        "Orphan swabs are swabs whose survey_week does not
        correspond to any date_symptom_survey
        <br/>"
      ))
    )
  )
}

server_raw_swab <- function(input, output, session, dat) {
  tbl <- reactive({
    all_dat <- dat()
    inner_join(
      all_dat$participant_essential,
      all_dat$swab,
      "record_id"
    )
  })

  tbl_orphan <- reactive({
    tbl_current <- tbl()
    if (input$orphan) {
      left_join(tbl_current, dat()$symptom, "record_id") %>%
        group_by(.data$record_id) %>%
        filter(!.data$survey_week %in% .data$date_symptom_survey) %>%
        ungroup() %>%
        select("record_id", "samp_date", "survey_week") %>%
        unique() %>%
        inner_join(tbl_current, c("record_id", "samp_date", "survey_week")) %>%
        select("record_id", "pid", "site_name", everything())
    } else {
      tbl_current
    }
  })

  callModule(server_raw_table, "swab-raw-table", tbl_orphan, "swabs")
}
