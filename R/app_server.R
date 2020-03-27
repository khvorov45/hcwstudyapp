#' @import shiny
app_server <- function(input, output, session) {
  dark_theme <- callModule(server_themeswitch, "themeswitch")
  client_tz_offset_sec <- reactive(as.numeric(input$client_tz_offset_sec))
  access_group <- callModule(server_apipass, "apipass")
  redcap_data <- callModule(
    server_updatedata, "updatedata", access_group, client_tz_offset_sec
  )
  redcap_data_site <- callModule(server_siteselect, "siteselect", redcap_data)
  callModule(server_raw_tables, "raw-tables", redcap_data_site)
  callModule(server_recruitvh, "recruitvh", redcap_data_site, dark_theme)
  callModule(server_participants, "participants", redcap_data_site)
  callModule(server_baseline, "baseline", redcap_data_site, dark_theme)
  callModule(server_symptoms, "symptoms", redcap_data_site)
  callModule(server_swabs, "swabs", redcap_data_site)
}
