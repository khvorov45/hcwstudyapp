#' Table of swabs
#' @noRd
ui_swabs <- function(id = "swabs", label = "Swabs") {
  ns <- NS(id)
  tablepanel(
    ns, label,
    shinyWidgets::prettyCheckbox(ns("orphan"), "Orphan"),
    HTML(
      "Orphan swabs are swabs whose survey_week does not
      correspond to any date_symptom_survey
      <br/>"
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
    inner_join(all_dat$swab, all_dat$participant, "record_id") %>%
      select("record_id", "pid", "site_name", everything())
  })
  update_tablepanel_dyn(session, tbl)

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
    } else tbl_current
  })

  tbl_new <- update_tbl_dyn(input, tbl_orphan)
  render_tablepanel_table(output, tbl_new)
  output$download <- download_data(output, "swab", tbl_new)
}
