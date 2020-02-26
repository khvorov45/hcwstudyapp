#' @import shiny
app_ui <- function() {
  tagList(

    golem_add_external_resources(),
    shinyjs::useShinyjs(),

    # Hidden input for client timezone determination
    # Filled by javascript in www/script.js
    HTML(
      '<input type="text" id="client_tz_offset_sec"
      name="client_tz_offset_sec" style="display: none;">'
    ),

    fluidPage(

      fluidRow(
        column(5, ui_apipass()),
        column(6, ui_updatedata()),
        column(1, HTML(
          "<a href='https://github.com/khvorov45/hcwstudyapp'>Source</a>"
        ))
      ),

      tabsetPanel(
        type = "tabs",

        ui_recruitvh(),
        ui_participants(),
        ui_symptoms()

      ), # tabsetPanel

    ), # fluidPage

    tags$script(src = "www/script.js")
  ) # tagList
} # app_ui

#' @import shiny
golem_add_external_resources <- function() {

  addResourcePath(
    'www', system.file('app/www', package = 'hcwstudyapp')
  )

  tags$head(
    golem::activate_js(),
    golem::favicon(),
    tags$link(
      rel = "stylesheet", type = "text/css",
      href = shinythemes::shinytheme("cyborg")
    ),
    tags$link(rel = "stylesheet", type = "text/css", href = "www/custom.css")
  )
}
