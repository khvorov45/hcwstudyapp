#' Tab with widgets to view recruitment by vaccination history
#' @noRd
tabrecruitvh <- function(id = "recruitvh", label = "Recruitment") {
  tabPanel(
    label,
    updatebutton(id)
  )
}

#' Server for recruitvh
#'
#' @param password_verified Reactive value returned by apipass
#'
#' @import ggplot2
#'
#' @noRd
server_recruitvh <- function(input, output, session, password_verified) {
  observeEvent(input$updatebutton, {
    if (is.null(password_verified())) return()
    if (!password_verified()) return()
    all_dat <- down_trans_redcap(golem::get_golem_options("token"))
    recruitvh_plot <- all_dat$participant %>%
      ggplot(aes(as.factor(.data$num_seas_vac))) +
      geom_histogram()
  })
}
