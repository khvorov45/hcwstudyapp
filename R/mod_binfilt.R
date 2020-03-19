#' Binary filter
#'
#' Group buttons to filter yes/no/missing
#'
#' @noRd
ui_binfilt <- function(id, label, var_name) {
  ns <- NS(id)
  shinyWidgets::checkboxGroupButtons(
    ns(var_name), label,
    list("Yes", "No", "Missing"),
    direction = "horizontal",
    justified = TRUE,
    selected = c("Yes", "No", "Missing")
  )
}

server_binfilt <- function(input, output, session, tbl, var_name) {
  reactive({
    mutate(
      tbl(),
      temp_var_binfilt = if_else(
        is.na(!!rlang::sym(var_name)), "Missing", !!rlang::sym(var_name)
      )
    ) %>%
      filter(.data$temp_var_binfilt %in% input[[var_name]]) %>%
      select(-"temp_var_binfilt")
  })
}
