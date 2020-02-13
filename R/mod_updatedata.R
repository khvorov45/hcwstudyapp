#' Button to update data
#' @noRd
ui_updatedata <- function(id = "updatedata", label = "Update data", colw = 3) {
  ns <- NS(id)
  column(
    colw,
    updatebutton(ns("update"), label),
    htmlOutput(ns("time"))
  )
}

server_updatedata <- function(input, output, session,
                              password_verified, client_tz_offset_sec) {
  all_dat <- reactiveVal()

  # Update on correct password update
  observe({
    if (is.null(password_verified())) return()
    if (password_verified())
      all_dat(update_data(output, client_tz_offset_sec()))
  })

  # Update on button press
  observeEvent(input$update, {
    if (is.null(password_verified())) return()
    if (!password_verified()) return()
    all_dat(update_data(output, client_tz_offset_sec()))
  })
  all_dat
}

update_data <- function(output, offset) {
  curtime <- lubridate::as_datetime(Sys.time(), tz = "UTC") - offset
  output$time <- renderUI({
    HTML(
      glue::glue(
        "<p>Last data update:<br/>{as.character(curtime)}</p>"
      )
    )
  })
  down_trans_redcap(golem::get_golem_options("token"))
}
