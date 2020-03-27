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

      # Title and contact details
      fluidRow(
        column(6, h3("HCW Cohort Study")),
        column(6, HTML(
          "<div id='contact'>
          <a href='https://github.com/khvorov45/hcwstudyapp'>Source</a>
          <br/>
          hcwcohortstudy@influenzacentre.org
          </div>"
        ))
      ),

      # Password, data update and theme swtich
      fluidRow(
        column(4, ui_apipass()),
        column(4, ui_updatedata()),
        column(2, ui_siteselect()),
        column(2, ui_themeswtich())
      ),

      # Tabs with functionality
      tabsetPanel(
        type = "tabs",

        ui_raw_tables(),
        ui_recruitvh(),
        ui_baseline(),
        ui_participants(),
        ui_symptoms(),
        ui_swabs()
      ), # tabsetPanel
    ), # fluidPage

    tags$script(src = "www/script.js")
  ) # tagList
} # app_ui

#' @import shiny
golem_add_external_resources <- function() {
  addResourcePath(
    "www", system.file("app/www", package = "hcwstudyapp")
  )

  tags$head(
    golem::activate_js(),
    golem::favicon(),
    tags$link(
      id = "shinytheme-css",
      rel = "stylesheet", type = "text/css",
      href = shinythemes::shinytheme("cyborg")
    ),
    tags$link(
      id = "always-css",
      rel = "stylesheet", type = "text/css", href = "www/always.css"
    ),
    tags$link(
      id = "extradark-css",
      rel = "stylesheet", type = "text/css", href = "www/extradark.css"
    )
  )
}
