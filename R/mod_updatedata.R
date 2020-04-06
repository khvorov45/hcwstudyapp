#' Update data UI
#'
#' Button to update and an info message with timestamp next to it
#'
#' @noRd
ui_updatedata <- function(id = "updatedata", label = "Update data") {
  ns <- NS(id)
  fluidRow(
    column(5, updatebutton(ns("update"), label)),
    column(7, htmlOutput(ns("time")))
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
    shinyjs::disable("update")
    input$update
    dat <- down_trans_redcap(
      golem::get_golem_options("token"),
      golem::get_golem_options("uri"),
      access_group()
    )
    shinyjs::enable("update")
    dat
  })

  observe({
    input$update
    if (access_group() == "none") {
      return()
    }
    print_timestamp(
      output, client_tz_offset_sec(), identical(redcap_data(), tibble())
    )
  })

  redcap_data
}

#' Prints timestamp for data update
#'
#' @param output Standard
#' @param offset Time offset (from UTC) in seconds
#'
#' @noRd
print_timestamp <- function(output, offset, empty) {
  curtime <- lubridate::as_datetime(Sys.time(), tz = "UTC") - offset
  info <- ifelse(empty, "No data in REDCap:", "Last data update:")
  output$time <- renderUI({
    HTML(
      glue::glue(
        "<p>{info}<br/>{as.character(curtime)}</p>"
      )
    )
  })
}
