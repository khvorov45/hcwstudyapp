#' List of sites to select
#' @noRd
siteselect <- function(id, label = "Site", choices = list("All"),
                       selected = NULL, multiple = FALSE) {
  selectInput(id, label, choices, selected, multiple)
}

#' Updates the above list, makes sure 'all' is persistent
#' @noRd
update_siteselect <- function(session, id, new_choices) {
  updateSelectInput(session, id, choices = as.list(c("All", new_choices)))
}
