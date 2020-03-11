#' Plots a histogram
#' @noRd
plot_hist <- function(dat, fontsize, dark) {
  if (dark) {
    ggdark::darken_geoms()
    pltheme <- ggdark::dark_theme_bw(base_size = fontsize, verbose = FALSE)
  } else {
    ggdark::lighten_geoms()
    pltheme <- theme_bw(base_size = fontsize)
  }
  dat %>%
    ggplot() +
    pltheme
}
