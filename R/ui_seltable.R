# Drop-down input for selecting tables
seltable <- function(id, label = "", table_list = list()) {
  ns <- NS(id)
  selectInput(
    ns("seltable"),
    label,
    table_list
  )
}
