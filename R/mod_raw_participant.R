ui_raw_participant <- function(id, label) {
  ns <- NS(id)
  ui_raw_table(
    ns("participant-raw-table"), label,
    fluidRow(
      column(3, ui_binfilt(
        ns("binfilt-addb"), "Consent to additional bleed", "add_bleed"
      )),
      column(4, ui_bqcomp(ns("bqcomp")))
    )
  )
}

server_raw_participant <- function(input, output, session, data) {
  tbl_participant <- reactive(data()$participant)
  tbl_part_addb <- callModule(
    server_binfilt, "binfilt-addb", tbl_participant, "add_bleed"
  )
  tbl_part_qmiss <- callModule(server_bqcomp, "bqcomp", tbl_part_addb)
  callModule(
    server_raw_table, "participant-raw-table", tbl_part_qmiss, "participant"
  )
}
