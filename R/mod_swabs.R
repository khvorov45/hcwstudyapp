#' Table of swabs
#' @noRd
ui_swabs <- function(id = "swabs", label = "Swabs") {
  ns <- NS(id)
  ui_tablepanel(
    ns("tablepanel"), label,
    data_ui = list(
      shinyWidgets::prettyCheckbox(ns("orphan"), "Orphan"),
      HTML(
        "Orphan swabs are swabs whose survey_week does not
        correspond to any date_symptom_survey
        <br/>"
      )
    )
  )
}

#' Server for swabs
#'
#' @inheritParams server_recruitvh
#'
#' @noRd
server_swabs <- function(input, output, session, dat) {
  tbl <- reactive({
    all_dat <- dat()
    inner_join(all_dat$swab, all_dat$participant_essential, "record_id") %>%
      select("record_id", "pid", "site_name", everything())
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

  callModule(server_tablepanel, "tablepanel", tbl_orphan, "swabs")
}
