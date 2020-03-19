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
    old_choices <- input$vars
    new_choices <- colnames(tbl())
    new_selected <- if (all(old_choices %in% new_choices)) {
      old_choices
    } else {
      new_choices
    }
    if (is.null(new_selected)) {
      new_selected <- new_choices
    }
    shinyWidgets::updatePickerInput(
      session, "vars",
      choices = as.list(new_choices), selected = as.list(new_selected)
    )
    new_selected
  })
}
