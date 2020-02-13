#' Input for the RedCap API password
#' @noRd
apipassword <- function(id, label = "") {
  passwordInput(
    id,
    label,
    value = golem::get_golem_options("default_password")
  )
}

#' Output for the checkmark
#' @noRd
apipasscheck <- function(id) {
  textOutput(
    id,
    inline = FALSE
  )
}
