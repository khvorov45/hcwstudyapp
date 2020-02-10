#' Run the Shiny Application
#'
#' @param token Path to file containing the token
#' @param ... Not used.
#'
#' @export
#' @importFrom shiny shinyApp
#' @importFrom golem with_golem_options
run_app <- function(token = "token", ...) {
  # Check if the file contains the actual token
  token <- process_apipass(token)
  if (!apipass_matches(token, api_pass_hashes[[1]]))
    rlang::abort(
      glue::glue("Cannot run the app without the correct token"),
      class = "token_mismatch"
    )
  with_golem_options(
    app = shinyApp(ui = app_ui, server = app_server),
    golem_opts = list(token = process_apipass(token), ...)
  )
}
