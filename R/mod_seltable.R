#' Tab with widgets to select a table
#' @noRd
tabseltable <- function(label = "Select table") {
  tabPanel(
    label,
    seltable("tabseltable"),
    nrowprint("tabseltable"),
    #selid,
    updatebutton("tabseltable")
  )
}
