ui_surveycomp <- function(id = "surveycomp", label = "Survey completion") {
  ns <- NS(id)
  ui_raw_table(
    ns("surveycomp"), label,
    shinyWidgets::radioGroupButtons(
      ns("filtertype"), "Filter",
      list(
        "All records" = "all", "Completed nothing" = "nothing",
        "Not everything" = "notevery"
      ),
      direction = "horizontal"
    )
  )
}


server_surveycomp <- function(input, output, session, data) {
  all_subject_surveys <- reactive({
    all_dat <- data()
    surveys <- all_dat$symptom %>%
      select(.data$record_id, .data$survey_week_index)
    subjects <- all_dat$participant %>%
      select(
        .data$record_id, .data$pid, .data$email, .data$mobile_number,
        .data$site_name, .data$date_screening
      )
    withdrawals <- all_dat$withdrawal

    left_join(subjects, surveys, "record_id") %>%
      # PID presence is proxy for consent/enrollment
      filter(!is.na(.data$pid), !.data$record_id %in% withdrawals$record_id)
  })

  weekly_survey_reference <- tibble(
    week_index = 1:30,
    date_monday = seq(
      lubridate::ymd("2020-04-06"),
      by = "weeks", length.out = 30
    )
  )

  survey_comp_table <- reactive({
    all_subject_surveys() %>%
      find_screening_week(weekly_survey_reference) %>%
      group_by(
        .data$record_id, .data$pid, .data$email,
        .data$mobile_number, .data$site_name, .data$screening_week
      ) %>%
      summarise(completed = list(.data$survey_week_index)) %>%
      ungroup() %>%
      mutate(
        should_have_completed = gen_should_complete(
          .data$screening_week, weekly_survey_reference
        ),
        did_not_complete = map2(
          .data$should_have_completed, .data$completed, setdiff
        )
      ) %>%
      select(-.data$screening_week)
  })

  survey_comp_table_allmiss <- reactive({
    if (input$filtertype == "nothing") {
      survey_comp_table() %>%
        filter(map_lgl(.data$should_have_completed, ~ length(.x) > 0)) %>%
        filter(
          map2_lgl(
            .data$should_have_completed, .data$did_not_complete,
            ~ all(.x %in% .y)
          )
        )
    } else if (input$filtertype == "notevery") {
      survey_comp_table() %>%
        filter(map_lgl(.data$should_have_completed, ~ length(.x) > 0)) %>%
        filter(
          map_lgl(.data$did_not_complete, ~ length(.x) > 0)
        )
    } else {
      survey_comp_table()
    }
  })

  callModule(
    server_raw_table, "surveycomp", survey_comp_table_allmiss, "surveycomp"
  )
}

find_screening_week <- function(data, weekly_survey_reference) {
  data %>%
    mutate(date_monday = find_monday(.data$date_screening)) %>%
    left_join(weekly_survey_reference, "date_monday") %>%
    rename(screening_week = .data$week_index) %>%
    mutate(screening_week = tidyr::replace_na(.data$screening_week, 0L))
}

find_monday <- function(dates) {
  lubridate::wday(dates, week_start = 1) <- 1
  dates
}

gen_should_complete <- function(screening_week_index, weekly_survey_reference) {
  latest_week <- weekly_survey_reference %>%
    filter(.data$date_monday <= Sys.Date()) %>%
    pull(.data$week_index) %>%
    max() - 1
  map(
    screening_week_index,
    function(i) if (i > latest_week) integer(0) else seq(max(1, i), latest_week)
  )
}
