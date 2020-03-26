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
  tbl_formatted <- reactive({
    mutate(tbl_qmiss(), age_screening = round(.data$age_screening, 1))
  })
  header_names <- site_altnames
  names(header_names) <- NULL
  tbl_html <- reactive(table_summary(
    inner_join(
      tbl_qmiss(),
      mutate(
        dat()$participant_recruit,
        num_seas_vac = if_else(
          is.na(.data$num_seas_vac),
          "(Missing)",
          as.character(.data$num_seas_vac)
        )
      ),
      "record_id"
    ),
    "site_name",
    col_ord = header_names,
    "Site"
  ))
  observe({
    var_lab <- input$var_lab
    callModule(
      server_plotpanel, "plotpanel",
      tbl_formatted,
      dark, plot_baseline, tbl_html,
      reactiveValues(var_lab = var_lab),
      data_name = "baseline"
    )
  })
}

plot_baseline <- function(dat, fontsize, dark, var_lab) {
  if (var_lab == "Gender") {
    dat %>%
      mutate(
        gender_fct = factor(.data$a1_gender, c("Male", "Female")) %>%
          forcats::fct_explicit_na()
      ) %>%
      count(.data$gender_fct) %>%
      plot_col(fontsize, dark, "gender_fct", "n", "Gender", "Number recruited")
  } else {
    plot_hist(
      dat, fontsize, dark, "age_screening", "Age at screening",
      "Number recruited"
    )
  }
}

table_baseline <- function(dat) {
  dat %>%
    knitr::kable("html") %>%
    kableExtra::kable_styling(
      bootstrap_options = c("striped", "hover", "condensed", "responsive"),
      full_width = FALSE,
      position = "left"
    )
}
