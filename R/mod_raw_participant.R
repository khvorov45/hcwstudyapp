ui_raw_participant <- function(id, label) {
  ns <- NS(id)
  ui_raw_table(
    ns("participant-raw-table"), label,
    fluidRow(
      column(3, ui_binfilt(
        ns("binfilt-addb"), "Consent to additional bleed", "add_bleed"
      )),
      column(4, shinyWidgets::radioGroupButtons(
        ns("qmiss"), "Questionnaire completeness",
        list("Any", "Complete", "Incomplete"),
        direction = "horizontal"
      ))
    )
  )
}

server_raw_participant <- function(input, output, session, data) {
  tbl_participant <- reactive(data()$participant)
  tbl_part_addb <- callModule(
    server_binfilt, "binfilt-addb", tbl_participant, "add_bleed"
  )
  tbl_part_qmiss <- reactive({
    tbl <- tbl_part_addb()
    if (input$qmiss == "Any") {
      return(tbl)
    }
    complete_ids <- tbl %>%
      select(
        -"pid", -"site_name", -"mobile_number", -"email",
        -"c3_spec", -"c4_spec"
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
  callModule(
    server_raw_table, "participant-raw-table", tbl_part_qmiss, "participant"
  )
}
