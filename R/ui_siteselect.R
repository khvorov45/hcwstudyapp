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

#' Dynamically updates the above list on password or data change
#' @noRd
update_siteselect_dyn <- function(session, id, password_verified, all_data) {
  observe({
    if (!canexec(password_verified(), all_data())) return()
    sites <- unique(all_data()$participant$site_name)
    update_siteselect(session, id, sites)
  })
}
