#' Plots a histogram
#' @noRd
plot_hist <- function(dat, fontsize, dark, var_lab) {
  if (dark) {
    ggdark::darken_geoms()
    pltheme <- ggdark::dark_theme_bw(base_size = fontsize, verbose = FALSE)
  } else {
    ggdark::lighten_geoms()
    pltheme <- theme_bw(base_size = fontsize)
  }
  var_names <- c("Gender" = "a1_gender", "Age" = "age_screening")
  geoms <- list("Gender" = geom_bar(), "Age" = geom_histogram(binwidth = 1))
  x_labs <- list("Gender" = "Gender", "Age" = "Age at screening")
  dat %>%
    ggplot(aes(!!rlang::sym(var_names[[var_lab]]))) +
    pltheme +
    xlab(x_labs[[var_lab]]) +
    geoms[[var_lab]]
}
