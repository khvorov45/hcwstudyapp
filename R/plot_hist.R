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
  var_names <- c("Gender" = "a1_gender")
  geoms <- list("Gender" = geom_bar())
  dat %>%
    ggplot(aes(!!rlang::sym(var_names[[var_lab]]))) +
    pltheme +
    xlab(var_lab) +
    geoms[[var_lab]]
}
