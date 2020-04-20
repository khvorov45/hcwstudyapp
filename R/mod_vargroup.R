ui_vargroup <- function(id, choices,
                        label = "Variable group", direction = "vertical") {
  ns <- NS(id)
  shinyWidgets::radioGroupButtons(
    ns("vargroup"), label,
    choices,
    direction = direction
  )
}

server_vargroup <- function(input, output, session, tbl) {
  observe({
    print(names(tbl()) %in% names(input$vargroup))
    print(names(input$vargroup))
  })
  reactive({
    dat <- tbl()
    if (input$vargroup == "all") {
      return(dat)
    }
    if (input$vargroup == "blinesurv") {
      select(
        dat,
        "pid", "baseline_q_date",
        "a1_gender", "a2_dob", "a3_atsi", "a4_children",
        "a5_height", "a6_weight",
        "b1_medicalhx",
        "c1_yrs_employed", "c2_emp_status", "c3_occupation",
        "c3_spec", "c4_workdept",
        "c4_spec", "c5_clin_care", "d1_future_vacc", "email"
      )
    } else if (input$vargroup == "schedule") {
      select(
        dat,
        "pid", "scheduled_date_v0", "scheduled_date_v7", "scheduled_date_v14",
        "scheduled_date_v280", "email"
      )
    } else {
      dat
    }
  })
}
