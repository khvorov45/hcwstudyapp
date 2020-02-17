#' @import shiny
app_server <- function(input, output, session) {
  client_tz_offset_sec <- reactive(as.numeric(input$client_tz_offset_sec))
  callModule(server_infolog, "infolog")
  password_verified <- callModule(server_apipass, "apipass")
  all_data <- callModule(
    server_updatedata, "updatedata", password_verified, client_tz_offset_sec
  )
  callModule(server_recruitvh, "recruitvh", password_verified, all_data)
  callModule(server_participants, "participants", password_verified, all_data)
}
