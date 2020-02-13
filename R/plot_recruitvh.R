plot_recruitvh <- function(dat) {
  dat %>%
    ggplot(aes(.data$num_seas_vac)) +
    geom_histogram()
}
