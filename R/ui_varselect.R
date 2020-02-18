#' List of variables to show
#' @noRd
varselect <- function(id, label = "Variables", choices = list()) {
  shinyWidgets::pickerInput(id, label, choices, multiple = TRUE)
}

#' Updates the above list
#' @noRd
update_varselect <- function(session, id, new_choices) {
  shinyWidgets::updatePickerInput(
    session, id, choices = as.list(new_choices)
  )
}

#' Dynamically updates the above list on password or data change
#' @noRd
update_varselect_dyn <- function(session, id, password_verified,
                                 all_data, varnames) {
  observe({
    if (!canexec(password_verified(), all_data())) return()
    update_varselect(session, id, varnames)
  })
}
