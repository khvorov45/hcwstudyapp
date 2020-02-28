plot_recruitvh <- function(dat, fontsize = 16, dark = TRUE) {
  if (dark) {
    ggdark::darken_geoms()
    pltheme <- ggdark::dark_theme_bw(base_size = fontsize, verbose = FALSE)
  } else {
    ggdark::lighten_geoms()
    pltheme <- theme_bw(base_size = fontsize)
  }
  dat %>%
    ggplot(aes(.data$num_seas_vac_fct)) +
    pltheme +
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
