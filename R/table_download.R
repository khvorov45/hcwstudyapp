table_download <- function(tbl, data_name) {
  downloadHandler(
    filename = function() {
      glue::glue("{data_name}.csv")
    },
    content = function(file) {
      readr::write_csv(all_listcol_to_chr(tbl()), file)
    }
  )
}

all_listcol_to_chr <- function(tbl) {
  mutate_if(tbl, is.list, listcol_to_chr)
}

listcol_to_chr <- function(listcol) {
  map_chr(listcol, paste, collapse = ",")
}
