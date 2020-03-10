#' UI for Yes-No-Missing filtering
#' @noRd
binfilt <- function(ns, label) {
  shinyWidgets::checkboxGroupButtons(
    ns("subsetswab"), label,
    list("Yes", "No", "Missing"),
    direction = "horizontal",
    justified = TRUE,
    selected = c("Yes", "No", "Missing")
  )
}
