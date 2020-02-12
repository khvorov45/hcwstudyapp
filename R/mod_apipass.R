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
  correct_input <- reactiveVal()
  observeEvent(input$updatebutton, {
    correct_input(apipass_matches(
      input$apipass, golem::get_golem_options("key"), api_pass_hashes
    ))
    valid <- ifelse(correct_input(), cli::symbol$tick, cli::symbol$cross)
    output$apipasscheck <- renderText(valid)
  })
  return(correct_input)
}
