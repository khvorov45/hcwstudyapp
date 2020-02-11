#' Input for the RedCap API password
#' @noRd
apipass <- function(id, label = "") {
  ns <- NS(id)
  passwordInput(
    ns("apipass"),
    label,
    value = golem::get_golem_options("default_password")
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
