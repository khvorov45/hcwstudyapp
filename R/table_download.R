table_download <- function(tbl, data_name) {
  downloadHandler(
    filename = function() {
      glue::glue("{data_name}.csv")
    },
    content = function(file) {
      readr::write_csv(tbl(), file)
    }
  )
}
