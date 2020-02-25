#' @import shiny
app_server <- function(input, output, session) {
  client_tz_offset_sec <- reactive(as.numeric(input$client_tz_offset_sec))
  access_group <- callModule(server_apipass, "apipass")
  redcap_data <- callModule(
    server_updatedata, "updatedata", access_group, client_tz_offset_sec
  )
  callModule(server_recruitvh, "recruitvh", redcap_data)
  callModule(server_participants, "participants", redcap_data)
}
