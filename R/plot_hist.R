plot_col <- function(dat, fontsize = 16, dark = TRUE, x_name, y_name,
                     x_lab, y_lab) {
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
    ggplot(aes(!!rlang::sym(x_name), !!rlang::sym(y_name))) +
    pltheme +
    plot_theme +
    scale_x_discrete(
      x_lab,
      drop = FALSE
    ) +
    scale_y_continuous(
      y_lab,
      labels = scales::number_format(1)
    ) +
    geom_col(fill = barcol) +
    geom_text(
      aes(y = 0.1, label = !!rlang::sym(y_name)),
      col = textcol, size = fontsize, vjust = 0
    ) +
    geom_text(
      aes(
        label = glue::glue("Total: ", sum(!!rlang::sym(y_name))),
        y = max(!!rlang::sym(y_name)) + 1
      ),
      x = 1, size = 0.5 * fontsize, vjust = 1, hjust = 0
    )
}

plot_hist <- function(dat, fontsize, dark, x_name,
                      x_lab, y_lab) {
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
  n_miss <- sum(is.na(dat[[x_name]]))
  n_tot <- nrow(dat)
  dat %>%
    ggplot(aes(!!rlang::sym(x_name))) +
    pltheme +
    plot_theme +
    scale_x_continuous(x_lab) +
    scale_y_continuous(
      y_lab,
      labels = scales::number_format(1)
    ) +
    geom_histogram(fill = barcol, binwidth = 1) +
    annotate(
      "text",
      label = glue::glue("Total: {n_tot}\nMissing: {n_miss}"),
      x = 0, y = 0, size = 0.5 * fontsize, vjust = 0, hjust = 0,
      col = textcol
    )
}

plot_theme <- theme(
  panel.grid.minor = element_blank(),
  panel.border = element_blank()
)
