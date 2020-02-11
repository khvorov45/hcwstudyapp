#' @import shiny
app_server <- function(input, output, session) {
  callModule(server_apipass, "apipass")
}
