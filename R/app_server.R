#' @import shiny
app_server <- function(input, output, session) {
  print(golem::get_golem_options("token"))
}
