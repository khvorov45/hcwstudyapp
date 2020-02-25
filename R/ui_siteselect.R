#' List of sites to select
#' @noRd
siteselect <- function(id, label = "Site", choices = list(), selected = NULL) {
  shinyWidgets::pickerInput(
    id, label, choices, selected, multiple = FALSE
  )
}

#' Updates the above list
#' @noRd
update_siteselect <- function(session, id, new_choices) {
  if (length(new_choices) > 1L)
    new_choices <- as.list(c("All", new_choices))
  else new_choices <- as.list(new_choices)
  shinyWidgets::updatePickerInput(session, id, choices = new_choices)
}

#' Dynamically updates the above list on data change
#' @noRd
update_siteselect_dyn <- function(session, id, dat) {
  observe({
    sites <- unique(dat()$participant$site_name)
    update_siteselect(session, id, sites)
  })
}

#' Dynamically filters tbl to only rows with site input
#' @noRd
filter_siteselect_dyn <- function(site, tbl) {
  eventReactive(site(), {
    site_sel <- ifelse(is.null(site()), "All", site())
    subs <- tbl()
    if (site_sel != "All") {
      subs <- dplyr::filter(subs, .data$site_name == site_sel)
    }
    subs
  })
}
