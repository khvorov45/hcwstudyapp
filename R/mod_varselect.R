ui_varselect <- function(id, label = "Table variables") {
  ns <- NS(id)
  shinyWidgets::pickerInput(
    ns("vars"), label,
    choices = list(),
    multiple = TRUE,
    options = shinyWidgets::pickerOptions(
      actionsBox = TRUE
    )
  )
}

server_varselect <- function(input, output, session, tbl) {
  reactive({
    data_choices <- colnames(tbl())
    shinyWidgets::updatePickerInput(
      session, "vars",
      choices = as.list(data_choices), selected = as.list(input$vars)
    )
    input$vars
  })
}
