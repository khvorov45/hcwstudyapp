plot_recruitvh <- function(dat, fontsize = 16, dark = TRUE) {
  if (dark) {
    ggdark::darken_geoms()
    pltheme <- ggdark::dark_theme_bw(base_size = fontsize, verbose = FALSE)
    barcol <- "gray25"
    textcol <- "gray75"
  } else {
    ggdark::lighten_geoms()
    pltheme <- theme_bw(base_size = fontsize)
    barcol <- "gray75"
    textcol <- "gray25"
  }
  dat %>%
    mutate(
      num_seas_vac_fct = factor(.data$num_seas_vac, levels = 0:5) %>%
        forcats::fct_explicit_na()
    ) %>%
    count(.data$num_seas_vac_fct) %>%
    ggplot(aes(.data$num_seas_vac_fct, .data$n)) +
    pltheme +
    theme(
      panel.grid.minor = element_blank()
    ) +
    scale_x_discrete(
      "Number of seasons vaccinated",
      drop = FALSE
    ) +
    scale_y_continuous(
      "Number recruited",
      labels = scales::number_format(1)
    ) +
    geom_col(fill = barcol) +
    geom_text(
      aes(y = 0.1, label = .data$n),
      col = textcol, size = fontsize, vjust = 0
    ) +
    geom_text(
      aes(label = glue::glue("Total: {sum(.data$n)}"), y = max(.data$n) + 1),
      x = 1, size = 0.5 * fontsize, vjust = 1, hjust = 0
    )
}
