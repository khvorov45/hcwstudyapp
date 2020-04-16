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
