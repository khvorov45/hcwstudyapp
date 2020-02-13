#' @import shiny
app_server <- function(input, output, session) {
  callModule(server_infolog, "infolog")
  password_verified <- callModule(server_apipass, "apipass")
  all_data <- callModule(server_updatedata, "updatedata", password_verified)
  callModule(server_recruitvh, "recruitvh", password_verified, all_data)
}
