#' Run the Shiny Application
#'
#' @param token String or path to file containing the RedCap API token.
#' @param ... Not used.
#'
#' @export
#' @importFrom shiny shinyApp
#' @importFrom golem with_golem_options
run_app <- function(token, ...) {
  token <- process_token(token)
  with_golem_options(
    app = shinyApp(ui = app_ui, server = app_server),
    golem_opts = list(token = token, ...)
  )
}
