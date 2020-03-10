#' UI for Yes-No-Missing filtering
#' @noRd
binfilt <- function(id, label) {
  shinyWidgets::checkboxGroupButtons(
    id, label,
    list("Yes", "No", "Missing"),
    direction = "horizontal",
    justified = TRUE,
    selected = c("Yes", "No", "Missing")
  )
}

#' Dynamically filter a yes/no variable
#'
#' @param dat Reactive data
#' @param filt Dynamic character vector of Yes/No/Missing
#' @param var_name Yes/No variable name
#'
#' @noRd
binfilt_fun <- function(dat, filt, var_name) {
  reactive({
    mutate(
      dat(),
      temp_var_binfilt = if_else(
        is.na(!!rlang::sym(var_name)), "Missing", !!rlang::sym(var_name)
      )
    ) %>%
      filter(.data$temp_var_binfilt %in% filt()) %>%
      select(-"temp_var_binfilt")
  })
}
