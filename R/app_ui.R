#' @import shiny
app_ui <- function() {
  tagList(

    golem_add_external_resources(),

    HTML(
      '<input type="text" id="client_tz_offset_sec"
      name="client_tz_offset_sec" style="display: none;">'
    ),

    fluidPage(

      tabsetPanel(
        type = "tabs",

        ui_apipass(),
        ui_recruitvh()

      ), # tabsetPanel

      fluidRow(
        ui_updatedata(colw = 3),
        column(9, ui_infolog())
      ) # fluidRow


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
    tags$link(rel = "stylesheet", type = "text/css", href = "www/custom.css")
  )
}
