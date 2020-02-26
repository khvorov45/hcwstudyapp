#' Table of symptoms
#' @noRd
ui_symptoms <- function(id = "symptoms", label = "Symptoms") {
  ns <- NS(id)
  tablepanel(ns, label)
}

#' Server for symptoms
#'
#' @inheritParams server_recruitvh
#'
#' @noRd
server_symptoms <- function(input, output, session, redcap_data) {

}
