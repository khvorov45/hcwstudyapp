ui_themeswtich <- function(id = "themeswitch") {
  ns <- NS(id)
  shinyWidgets::switchInput(
    inputId = ns("themeswitch"), onLabel = "Dark", offLabel = "Light",
    value = TRUE
  )
}

server_themeswitch <- function(input, output, session) {
  observe({print(input$themeswitch)})
}
