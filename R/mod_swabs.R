#' Table of swabs
#' @noRd
ui_swabs <- function(id = "swabs", label = "Swabs") {
  ns <- NS(id)
  tablepanel(ns, label)
}

#' Server for swabs
#'
#' @inheritParams server_recruitvh
#'
#' @noRd
server_swabs <- function(input, output, session, dat) {
  tbl <- reactive({
    all_dat <- dat()
    inner_join(all_dat$swab, all_dat$participant, "record_id") %>%
      select("record_id", "pid", "site_name", everything())
  })
  update_tablepanel_dyn(session, tbl)
  tbl_new <- update_tbl_dyn(input, tbl)
  render_tablepanel_table(output, tbl_new)
  output$download <- download_data(output, "swab", tbl_new)
}
