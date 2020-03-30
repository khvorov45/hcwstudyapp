plot_vachx <- function(dat, fontsize, dark) {
  dat %>%
    mutate(
      num_seas_vac_fct = factor(.data$num_seas_vac, levels = 0:5) %>%
        forcats::fct_explicit_na()
    ) %>%
    count(.data$num_seas_vac_fct) %>%
    plot_col(
      fontsize, dark, "num_seas_vac_fct", "n",
      "Number of seasons vaccinated",
      "Number recruited"
    )
}
