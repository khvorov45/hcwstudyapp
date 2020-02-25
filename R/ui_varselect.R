#' List of variables to show
#' @noRd
varselect <- function(id, label = "Variables", choices = list()) {
  shinyWidgets::pickerInput(
    id, label, choices, multiple = TRUE,
    options = shinyWidgets::pickerOptions(
      actionsBox = TRUE
    )
  )
}

#' Updates the above list
#' @noRd
update_varselect <- function(session, id, new_choices) {
  shinyWidgets::updatePickerInput(
    session, id, choices = as.list(new_choices), selected = as.list(new_choices)
  )
}

#' Dynamically updates the above list on password or data change.
#'
#' Returns the data with the appropriate names
#'
#' @param session From server function
#' @param id Id of varselect element
#' @param dat Reactive data to take names from
#'
#' @noRd
update_varselect_dyn <- function(session, id, dat) {
  observe({
    update_varselect(session, id, colnames(dat()))
  })
}

select_vars_dyn <- function(vars, tbl) {
  reactive({
    if (is.null(vars())) return(tbl())
    tbl()[vars()]
  })
}
