#' Input for the RedCap API password
#' @noRd
apipassword <- function(id, label = "Password") {
  passwordInput(
    id,
    label,
    value = Sys.getenv("REDAPIPASS")
  )
}

#' Output for the checkmark
#' @noRd
apipasscheck <- function(id) {
  htmlOutput(
    id,
    inline = TRUE
  )
}
