#' Input for the RedCap API password
#' @noRd
apipass <- function(id, label = "") {
  ns <- NS(id)
  passwordInput(
    ns("apipass"),
    label,
    # data-raw/token-alt only exists in development
    value = process_apipass("data-raw/token-alt")
  )
}

#' Output for the checkmark
#' @noRd
apipasscheck <- function(id) {
  ns <- NS(id)
  textOutput(
    ns("apipasscheck"),
    inline = FALSE
  )
}
