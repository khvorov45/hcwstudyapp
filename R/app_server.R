#' @import shiny
app_server <- function(input, output, session) {
  callModule(server_apipass, "apipass")
  callModule(server_seltable, "seltable")
}
