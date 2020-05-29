table_simple_html <- function(tbl) {
  tbl %>%
    mutate_if(lubridate::is.Date, as.character) %>%
    mutate_if(is.numeric, function(vec) round(vec, 1)) %>%
    mutate_if(
      is.list, function(vec) {
        map_chr(vec, paste0, collapse = "; ") %>%
          tidyr::replace_na("")
      }
    ) %>%
    knitr::kable(
      "html",
      align = "c"
    ) %>%
    kableExtra::kable_styling(
      bootstrap_options = c("striped", "hover", "condensed", "responsive"),
      full_width = FALSE
    )
}
