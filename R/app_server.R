#' @import shiny
app_server <- function(input, output, session) {
  password_verified <- callModule(server_apipass, "apipass")
  callModule(server_seltable, "seltable", password_verified)
  callModule(server_recruitvh, "recruitvh", password_verified)
}
