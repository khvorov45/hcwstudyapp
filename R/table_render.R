table_render <- function(tbl) {
  DT::renderDataTable(
    tbl,
    style = "bootstrap4",
    rownames = FALSE,
    options = list(
      dom = "pt",
      columnDefs = list(
        list(className = "dt-center", targets = 1:ncol(tbl) - 1)
      ),
      scrollX = TRUE
    )
  )
}
