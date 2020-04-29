table_render <- function(tbl, vars = NULL, pagelength = 100) {
  if (!is.null(vars)) tbl <- tbl[vars]
  DT::renderDataTable(
    tbl,
    server = FALSE,
    style = "bootstrap4",
    rownames = FALSE,
    options = list(
      dom = "pt",
      columnDefs = list(
        list(className = "dt-center", targets = seq_len(ncol(tbl) - 1))
      ),
      scrollX = TRUE,
      pageLength = pagelength
    )
  )
}

table_simple_html <- function(tbl, vars) {
  if (!is.null(vars)) tbl <- tbl[vars]
  tbl %>%
    mutate_if(lubridate::is.Date, as.character) %>%
    mutate_if(is.numeric, function(vec) round(vec, 1)) %>%
    knitr::kable(
      "html",
      align = "c"
    ) %>%
    kableExtra::kable_styling(
      bootstrap_options = c("striped", "hover", "condensed", "responsive"),
      full_width = FALSE
    )
}
