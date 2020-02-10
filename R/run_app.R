#' Run the Shiny Application
#'
#' @param token String or path to file containing the token
#' @param ... Not used.
#'
#' @export
#' @importFrom shiny shinyApp
#' @importFrom golem with_golem_options
run_app <- function(token = "token", ...) {
  with_golem_options(
    app = shinyApp(ui = app_ui, server = app_server),
    golem_opts = list(token = token, ...)
  )
}
