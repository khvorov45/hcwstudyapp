#' Creates the summary table
#'
#' @param dat The full participant table. Non-reactive
#' @param by_var Name of variable whose values will be the columns
#' @param col_ord Order of columns of `by_var`
#' @param by_var_lab Label to give to the `by_var` values collectively
#'
#' @noRd
table_summary <- function(dat, by_var, col_ord, by_var_lab, position = "left") {
  dat <- mutate(
    dat,
    !!rlang::sym(by_var) := if_else(
      is.na(!!rlang::sym(by_var)),
      "(Missing)",
      as.character(!!rlang::sym(by_var))
    ),
    age_group = as.character(cut(
      .data$age_screening, c(-Inf, 35, 60, Inf),
      right = FALSE
    )),
    bmi_group = as.character(cut(
      .data$bmi, c(-Inf, 25, 30, Inf),
      right = FALSE
    ))
  )

  tbl_vars <- c(
    "Gender" = "a1_gender",
    "Age" = "age_screening",
    "Age group" = "age_group",
    "Aboriginal and/or Torres Strait Islander" = "a3_atsi",
    "Children living in household" = "a4_children",
    "BMI" = "bmi",
    "BMI group" = "bmi_group",
    "Medical history" = "b1_medicalhx",
    "Years employed" = "c1_yrs_employed",
    "Employment status" = "c2_emp_status",
    "Occupation type" = "c3_occupation",
    "Work department" = "c4_workdept",
    "Direct clinical care" = "c5_clin_care"
  )

  if (by_var == "site_name") {
    tbl_vars <- c("Prior vaccinations" = "num_seas_vac", tbl_vars)
  } else {
    tbl_vars <- c("Site" = "site_name", tbl_vars)
  }

  all_tbls <- map(tbl_vars, ~ table_recruitvh_gen(dat, col_ord, .x, by_var))
  tbl_indeces <- map(all_tbls, nrow)
  tbl_total <- table_recruitvh_tot(dat, col_ord, by_var)
  high_head <- c("", length(colnames(tbl_total)[-1]))
  names(high_head) <- c("", by_var_lab)
  tbl_total %>%
    bind_rows(all_tbls) %>%
    knitr::kable(
      "html",
      align = paste0(
        c("l", rep("c", length(colnames(tbl_total)[-1]), collapse = ""))
      ),
      col.names = c("", colnames(tbl_total)[-1])
    ) %>%
    kableExtra::kable_styling(
      bootstrap_options = c("striped", "hover", "condensed", "responsive"),
      full_width = FALSE,
      position = position
    ) %>%
    kableExtra::add_header_above(
      high_head,
      line = FALSE
    ) %>%
    kableExtra::pack_rows(
      index = c("", tbl_indeces),
      label_row_css = "border-color: #666"
    )
}

table_recruitvh_gen <- function(tbl, col_ord, var_name, by_var) {
  if (is.numeric(tbl[[var_name]])) {
    table_recruitvh_num(tbl, col_ord, var_name, by_var)
  } else {
    table_recruitvh_cat(tbl, col_ord, var_name, by_var)
  }
}

table_recruitvh_cat <- function(tbl, col_ord, var_name, by_var) {
  if (is.list(tbl[[var_name]])) {
    tbl <- tidyr::unnest(tbl, cols = !!rlang::sym(var_name))
  }
  tbl <- tbl %>%
    mutate(
      !!rlang::sym(var_name) := if_else(
        is.na(!!rlang::sym(var_name)), "(Missing)", !!rlang::sym(var_name)
      )
    ) %>%
    count(!!rlang::sym(var_name), !!rlang::sym(by_var)) %>%
    mutate(n = as.character(.data$n)) %>%
    tidyr::pivot_wider(
      names_from = !!rlang::sym(by_var), values_from = .data$n
    )
  col_sel <- col_ord[col_ord %in% colnames(tbl)]
  select(tbl, "variable" = !!rlang::sym(var_name), !!!col_sel)
}

#' @importFrom stats sd
table_recruitvh_num <- function(tbl, col_ord, var_name, by_var, digits = 1) {
  tbl <- tbl %>%
    group_by(!!rlang::sym(by_var)) %>%
    summarise(
      var_mean = mean(!!rlang::sym(var_name), na.rm = TRUE) %>% round(digits),
      var_sd = sd(!!rlang::sym(var_name), na.rm = TRUE) %>% round(digits),
      variable = glue::glue("{var_mean} \u00B1 {var_sd}") %>% as.character()
    ) %>%
    select(-"var_mean", -"var_sd") %>%
    tidyr::pivot_wider(
      names_from = !!rlang::sym(by_var), values_from = .data$variable
    ) %>%
    mutate(variable = glue::glue("Mean \u00B1 sd") %>% as.character())
  col_sel <- col_ord[col_ord %in% colnames(tbl)]
  select(tbl, "variable", !!!col_sel)
}

table_recruitvh_tot <- function(tbl, col_ord, by_var) {
  tbl <- tbl %>%
    count(!!rlang::sym(by_var)) %>%
    mutate(n = as.character(.data$n)) %>%
    tidyr::pivot_wider(
      names_from = !!rlang::sym(by_var), values_from = .data$n
    ) %>%
    mutate(variable = "Total")
  col_sel <- col_ord[col_ord %in% colnames(tbl)]
  select(tbl, "variable", !!!col_sel)
}
