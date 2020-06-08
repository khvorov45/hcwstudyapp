ui_withdrawn <- function(id, label = "Withdrawal status") {
  ns <- NS(id)
  shinyWidgets::radioGroupButtons(
    ns("withdrawn"), label,
    list("Any", "Not withdrawn", "Withdrawn"),
    direction = "horizontal",
    justified = FALSE,
    selected = c("Not withdrawn")
  )
}

server_withdrawn <- function(input, output, session, all_dat, tbl_name) {
  observe(print(input$withdrawn))
  reactive({
    all_data <- all_dat()
    dat <- all_data[[tbl_name]]
    if (input$withdrawn == "Any") {
      dat
    } else if (input$withdrawn == "Not withdrawn") {
      filter(dat, !.data$record_id %in% all_data$withdrawal$record_id)
    } else {
      filter(dat, .data$record_id %in% all_data$withdrawal$record_id)
    }
  })
}
