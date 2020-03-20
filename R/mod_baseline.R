#' Baseline characteristice
#' @noRd
ui_baseline <- function(id = "baseline", label = "Baseline") {
  ns <- NS(id)
  ui_plotpanel(
    ns("plotpanel"), label,
    data_ui = list(
      shinyWidgets::radioGroupButtons(
        ns("qmiss"), "Questionnaire completeness",
        list("Any", "Complete", "Incomplete"),
        direction = "horizontal"
      )
    ),
    plot_ui = list(
      shinyWidgets::pickerInput(
        ns("var_lab"), "Plot variable",
        list("Gender", "Age")
      )
    )
  )
}

#' Server for baseline
#'
#' @inheritParams server_recruitvh
#'
#' @importFrom rlang !!
#'
#' @noRd
server_baseline <- function(input, output, session, dat, dark) {
  tbl <- reactive(inner_join(
    dat()$participant_essential,
    dat()$participant_baseline,
    "record_id"
  ))
  tbl_qmiss <- reactive({
    tbl <- tbl()
    if (input$qmiss == "Any") {
      return(tbl)
    }
    complete_ids <- tbl %>%
      select(
        -"pid", -"site_name", -"mobile_number", -"email",
        -"c3_spec", -"c4_spec"
      ) %>%
      mutate_all(as.character) %>%
      tidyr::pivot_longer(
        -"record_id",
        names_to = "question", values_to = "response"
      ) %>%
      group_by(.data$record_id) %>%
      summarise(complete_status = all(!is.na(.data$response))) %>%
      filter(.data$complete_status) %>%
      pull(.data$record_id)
    if (input$qmiss == "Complete") {
      filter(tbl, .data$record_id %in% complete_ids)
    } else {
      filter(tbl, !.data$record_id %in% complete_ids)
    }
  })
  observe({
    var_lab <- input$var_lab
    callModule(
      server_plotpanel, "plotpanel", tbl_qmiss, dark, plot_hist,
      reactiveValues(var_lab = var_lab),
      data_name = "baseline"
    )
  })
}
