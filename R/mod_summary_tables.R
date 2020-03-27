ui_summary_tables <- function(id = "summary-tables", label = "Summary tables") {
  ns <- NS(id)
  tabPanel(
    label,
    tabsetPanel(
      type = "tabs",
      tabPanel("By vaccination history", tableOutput(ns("vachx"))),
      tabPanel("By site", tableOutput(ns("site")))
    )
  )
}

server_summary_tables <- function(input, output, session, data) {
  table_html_vachx <- reactive(table_summary(
    data()$participant,
    "num_seas_vac",
    col_ord = c("0", "1", "2", "3", "4", "5", "(Missing)"),
    "Prior vaccinations",
    position = "center"
  ))
  output$vachx <- function() table_html_vachx()

  header_names <- site_altnames
  names(header_names) <- NULL
  table_html_site <- reactive(table_summary(
    mutate(
      data()$participant,
      num_seas_vac = if_else(
        is.na(.data$num_seas_vac),
        "(Missing)",
        as.character(.data$num_seas_vac)
      )
    ),
    "site_name",
    col_ord = header_names,
    "Site"
  ))
  output$site <- function() table_html_site()
}
