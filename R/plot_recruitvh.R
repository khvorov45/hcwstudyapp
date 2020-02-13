plot_recruitvh <- function(dat) {
  dat %>%
    ggplot(aes(.data$num_seas_vac_fct)) +
    ggdark::dark_theme_bw(base_size = 16, verbose = FALSE) +
    theme(
      panel.grid.minor = element_blank()
    ) +
    scale_x_discrete(
      "Number of seasons vaccinated", drop = FALSE
    ) +
    scale_y_continuous(
      "Number recruited", labels = scales::number_format(1)
    ) +
    geom_bar()
}
