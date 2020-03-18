#' Select site UI
#'
#' Button to select site
#'
#' @noRd
ui_siteselect <- function(id = "siteselect2", label = "Site") {
  ns <- NS(id)
  shinyWidgets::pickerInput(
    ns("site2"), label,
    choices = list(), selected = list(),
    multiple = FALSE
  )
}

#' Select site server
#'
#' Filters all tables to the appropriate site
#'
#' @noRd
server_siteselect <- function(input, output, session, data) {
  observe({
    sites <- unique(data()$participant_essential$site_name)
    update_siteselect2(session, "site2", sites)
  })
  sitedata <- reactive({
    cur_dat <- data()
    if (is.null(input$site2)) {
      return(cur_dat)
    }
    if (input$site2 == "All") {
      return(cur_dat)
    }
    site_ids <- cur_dat$participant_essential %>%
      filter(.data$site_name == input$site2) %>%
      pull("record_id")
    map(cur_dat, ~ filter(.x, .data$record_id %in% site_ids))
  })
  sitedata
}

#' Updates the above list
#' @noRd
update_siteselect2 <- function(session, id, new_choices) {
  if (length(new_choices) > 1L) {
    new_choices <- as.list(c("All", new_choices))
  } else {
    new_choices <- as.list(new_choices)
  }
  shinyWidgets::updatePickerInput(session, id, choices = new_choices)
}
