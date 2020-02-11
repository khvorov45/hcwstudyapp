#' Run the Shiny Application
#'
#' @param token Path to file containing the token
#' @param key Path to file containing the key used to create hashes
#' @param ... Not used.
#'
#' @export
#' @importFrom shiny shinyApp
#' @importFrom golem with_golem_options
run_app <- function(token = "token", key = "key", ...) {
  # Check if the file contains the actual token
  token <- process_apipass(token)
  key <- process_apipass(key)
  if (!apipass_matches(token, key, api_pass_hashes[[1]]))
    rlang::abort(
      glue::glue("Cannot run the app without the correct token"),
      class = "token_mismatch"
    )
  with_golem_options(
    app = shinyApp(ui = app_ui, server = app_server),
    golem_opts = list(token = token, key = key, ...)
  )
}
