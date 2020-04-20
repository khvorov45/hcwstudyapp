#' Run the Shiny Application
#'
#' @param token Path to file containing the token
#' @param key Path to file containing the key used to create hashes
#' @param uri REDCap API uri
#' @param port Port to host the app on
#' @param ... Additional golem options
#'
#' @export
#' @importFrom shiny shinyApp
#' @importFrom golem with_golem_options
run_app <- function(token = "token", key = "key",
                    uri = "https://biredcap.mh.org.au/api/",
                    port = getOption("shiny.port"), ...) {
  # Check if the file contains the right token/key combination
  token <- readLines(token)
  key <- readLines(key)
  if (!apipass_matches(token, key, hash_list$api_token_hash)) {
    rlang::abort(
      "Cannot run the app without the correct token/key combination",
      class = "token_key_mismatch"
    )
  }
  with_golem_options(
    app = shinyApp(
      ui = app_ui, server = app_server, options = list(port = port)
    ),
    golem_opts = list(token = token, key = key, uri = uri, ...)
  )
}
