#' Password input
#'
#' Masked text input and an update button next to it
#'
#' @noRd
ui_apipass <- function(id = "apipass", label = "Password") {
  ns <- NS(id)
  fluidRow(
    column(6, apipassword(ns("apipassword"))),
    column(
      6,
      updatebutton(ns("update"), "Update password"),
      apipasscheck(ns("check"))
    )
  )
}

#' Password input processing
#'
#' Returns reactive access group.
#' Prints cross if incorrect password.
#' Prints two ticks if access to everything is granted
#' Prints one tick for single-site access
#'
#' @noRd
server_apipass <- function(input, output, session) {
  access_group <- eventReactive(input$update, {
    find_apipass_match(input$apipassword, golem::get_golem_options("key"))
  })
  observeEvent(input$update, {
    valid <- case_when(
      access_group() == "all" ~ glue::glue(
        "<span class = 'tick'>{cli::symbol$tick}{cli::symbol$tick}</span>"
      ),
      access_group() == "none" ~ glue::glue(
        "<span class = 'cross'>{cli::symbol$cross}</span>"
      ),
      TRUE ~  glue::glue("<span class = 'tick'>{cli::symbol$tick}</span>")
    )
    output$check <- renderUI(HTML(valid))
  })
  access_group
}
