#' Table output
#' @noRd
seltableout <- function(id = "seltableout") {
  tableOutput(id)
}

server_seltableout <- function(input, output, session,
                               password_verified, all_dat) {
  print(names(output))
  output$seltableout <- renderTable({all_dat()$participant})
}
