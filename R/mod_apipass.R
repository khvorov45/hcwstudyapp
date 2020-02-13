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
    valid <- ifelse(
      correct_input(),
      glue::glue("<span class = 'tick'>{cli::symbol$tick}</span>"),
      glue::glue("<span class = 'cross'>{cli::symbol$cross}</span>")
    )
    output$check <- renderUI(HTML(valid))
  })
  correct_input
}
