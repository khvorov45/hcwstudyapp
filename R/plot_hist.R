#' Plots a histogram
#' @noRd
plot_hist <- function(dat, fontsize, dark, var_name) {
  if (dark) {
    ggdark::darken_geoms()
    pltheme <- ggdark::dark_theme_bw(base_size = fontsize, verbose = FALSE)
  } else {
    ggdark::lighten_geoms()
    pltheme <- theme_bw(base_size = fontsize)
  }
  if (var_name == "a1_gender") {
    the_geom <- geom_bar()
  } else {
    the_geom <- geom_histogram(bins = 30)
  }
  dat %>%
    ggplot(aes(!!rlang::sym(var_name))) +
    pltheme +
    the_geom
}
