#' @import shiny
app_ui <- function() {
  tagList(

    golem_add_external_resources(),

    fluidPage(

      sidebarLayout(

        sidebarPanel(
          tabsetPanel(
            type = "tabs",
            tabPanel(
              "Select table",
              seltable("tabseltable"),
              nrowprint("tabseltable"),
              #selid,
              updatebutton("tabseltable")
            )
            #tabPanel(
            #  "Join tables",
            #  numericInput("temp", "Temp", 1)
            #)
          ) # tabsetPanel
        ), # sidebarPanel

        mainPanel(
          tableOutput("tableview")
        )
      ) # sidebarLayout
    ) # fluidPage
  ) # tagList
}

#' @import shiny
golem_add_external_resources <- function() {

  addResourcePath(
    'www', system.file('app/www', package = 'hcwstudyapp')
  )

  tags$head(
    golem::activate_js(),
    golem::favicon()
    # Add here all the external resources
    # If you have a custom.css in the inst/app/www
    # Or for example, you can add shinyalert::useShinyalert() here
    #tags$link(rel="stylesheet", type="text/css", href="www/custom.css")
  )
}
