#' Update data UI
#'
#' Button to update and an info message with timestamp next to it
#'
#' @noRd
ui_updatedata <- function(id = "updatedata", label = "Update data", colw = 3) {
  ns <- NS(id)
  fluidRow(
    column(3, updatebutton(ns("update"), label)),
    column(9, htmlOutput(ns("time")))
  )
}

#' Update data
#'
#' Button to update and an info message with timestamp next to it
#'
#' @param input,output,session standard
#' @param access_group Reactive access group
#' @param client_tz_offset_sec Reactive time offset (from UTC)
#'
#' @noRd
server_updatedata <- function(input, output, session,
                              access_group, client_tz_offset_sec) {
  redcap_data <- reactive({
    input$update
    down_trans_redcap(
      golem::get_golem_options("token"),
      golem::get_golem_options("uri"),
      access_group()
    )
  })

  observe({
    input$update
    if (access_group() == "none") return()
    print_timestamp(output, client_tz_offset_sec())
  })

  redcap_data
}

#' Prints timestamp for data update
#'
#' @param output Standard
#' @param offset Time offset (from UTC) in seconds
#'
#' @noRd
print_timestamp <- function(output, offset) {
  curtime <- lubridate::as_datetime(Sys.time(), tz = "UTC") - offset
  output$time <- renderUI({
    HTML(
      glue::glue(
        "<p>Last data update:<br/>{as.character(curtime)}</p>"
      )
    )
  })
}
