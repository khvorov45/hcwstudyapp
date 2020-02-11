#' Tab to input RedCap API token
#' @noRd
tabapipass <- function(id = "apipass", label = "Password") {
  tabPanel(
    label,
    apipass(id),
    updatebutton(id),
    apipasscheck(id)
  )
}

server_apipass <- function(input, output, session) {
  output$apipasscheck <- renderText(cli::symbol$tick)
}
