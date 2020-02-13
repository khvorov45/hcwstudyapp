#' Tab to input RedCap API token
#' @noRd
ui_apipass <- function(id = "apipass", label = "Password") {
  ns <- NS(id)
  tabPanel(
    label,
    apipassword(ns("apipassword")),
    updatebutton(ns("update"), "Update password"),
    apipasscheck(ns("check"))
  )
}

server_apipass <- function(input, output, session) {
  correct_input <- reactiveVal()
  observeEvent(input$update, {
    correct_input(apipass_matches(
      input$apipassword, golem::get_golem_options("key"), api_pass_hashes
    ))
    valid <- ifelse(correct_input(), cli::symbol$tick, cli::symbol$cross)
    output$check <- renderText(valid)
  })
  correct_input
}
