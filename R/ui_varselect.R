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

#' Dynamically updates the above list on password or data change.
#'
#' Returns the data with the appropriate names
#'
#' @param session,input From server function
#' @param id Id of varselect element
#' @param password_verified,all_data Reactive values I pass around
#' @param tbl_name Name of table in \code{all_data}
#' @param use_ognames_name Name of boolean input to determine which names to use
#'
#' @noRd
update_varselect_dyn <- function(session, id, password_verified,
                                 all_data, tbl_name,
                                 input, use_ognames_name) {
  ret_tbl <- reactiveVal(tibble())
  observe({
    use_ognames <- input[[use_ognames_name]]
    if (!canexec(password_verified(), all_data())) return()
    subs <- all_data()[[tbl_name]]
    og_names <- names(subs)
    new_names <- altnames(og_names)
    if (!use_ognames) {
      names(subs) <- new_names
      update_varselect(session, id, new_names)
    }
    else update_varselect(session, id, og_names)
    ret_tbl(subs)
  })
  ret_tbl
}
