#' Determines if a reaction can continue
#'
#' @param pass password verification result
#' @param dat Data extraction result
#'
#' @noRd
canexec <- function(pass, dat) {
  if (is.null(pass) | is.null(dat)) return(FALSE)
  pass
}
