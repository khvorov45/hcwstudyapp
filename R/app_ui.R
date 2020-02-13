#' @import shiny
app_ui <- function() {
  tagList(

    golem_add_external_resources(),

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


    ) # fluidPage
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
    # Add here all the external resources
    # If you have a custom.css in the inst/app/www
    # Or for example, you can add shinyalert::useShinyalert() here
    tags$link(rel = "stylesheet", type = "text/css", href = "www/custom.css")
  )
}
