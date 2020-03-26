#' Creates the summary table
#'
#' @param dat The full participant table. Non-reactive
#'
#' @noRd
table_recruitvh <- function(dat) {
  dat <- mutate(
    dat,
    num_seas_vac_fct = factor(.data$num_seas_vac, levels = 0:5) %>%
      forcats::fct_explicit_na(),
    age_group = as.character(cut(
      .data$age_screening, c(-Inf, 35, 60, Inf),
      right = FALSE
    )),
    bmi_group = as.character(cut(
      .data$bmi, c(-Inf, 25, 30, Inf),
      right = FALSE
    ))
  )
  col_ord <- c("0", "1", "2", "3", "4", "5", "(Missing)")
  tbl_vars <- c(
    "Site" = "site_name",
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
  all_tbls <- map(tbl_vars, ~ table_recruitvh_gen(dat, col_ord, .x))
  tbl_indeces <- map(all_tbls, nrow)
  tbl_total <- table_recruitvh_tot(dat, col_ord)
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
      position = "left"
    ) %>%
    kableExtra::add_header_above(
      c("", "Prior vaccinations" = length(colnames(tbl_total)[-1])),
      line = FALSE
    ) %>%
    kableExtra::pack_rows(
      index = c("", tbl_indeces),
      label_row_css = "border-color: #666"
    )
}

table_recruitvh_gen <- function(tbl, col_ord, var_name) {
  if (is.numeric(tbl[[var_name]])) {
    table_recruitvh_num(tbl, col_ord, var_name)
  } else {
    table_recruitvh_cat(tbl, col_ord, var_name)
  }
}

table_recruitvh_cat <- function(tbl, col_ord, var_name) {
  if (is.list(tbl[[var_name]])) {
    tbl <- tidyr::unnest(tbl, cols = !!rlang::sym(var_name))
  }
  tbl <- tbl %>%
    mutate(
      !!rlang::sym(var_name) := if_else(
        is.na(!!rlang::sym(var_name)), "(Missing)", !!rlang::sym(var_name)
      )
    ) %>%
    count(!!rlang::sym(var_name), .data$num_seas_vac_fct) %>%
    mutate(n = as.character(.data$n)) %>%
    tidyr::pivot_wider(
      names_from = .data$num_seas_vac_fct, values_from = .data$n
    )
  col_sel <- col_ord[col_ord %in% colnames(tbl)]
  select(tbl, "variable" = !!rlang::sym(var_name), !!!col_sel)
}

#' @importFrom stats sd
table_recruitvh_num <- function(tbl, col_ord, var_name, digits = 1) {
  tbl <- tbl %>%
    group_by(.data$num_seas_vac_fct) %>%
    summarise(
      var_mean = mean(!!rlang::sym(var_name), na.rm = TRUE) %>% round(digits),
      var_sd = sd(!!rlang::sym(var_name), na.rm = TRUE) %>% round(digits),
      variable = glue::glue("{var_mean} \u00B1 {var_sd}") %>% as.character()
    ) %>%
    select(-"var_mean", -"var_sd") %>%
    tidyr::pivot_wider(
      names_from = .data$num_seas_vac_fct, values_from = .data$variable
    ) %>%
    mutate(variable = glue::glue("Mean \u00B1 sd") %>% as.character())
  col_sel <- col_ord[col_ord %in% colnames(tbl)]
  select(tbl, "variable", !!!col_sel)
}

table_recruitvh_tot <- function(tbl, col_ord) {
  tbl <- tbl %>%
    count(.data$num_seas_vac_fct) %>%
    mutate(n = as.character(.data$n)) %>%
    tidyr::pivot_wider(
      names_from = .data$num_seas_vac_fct, values_from = .data$n
    ) %>%
    mutate(variable = "Total")
  col_sel <- col_ord[col_ord %in% colnames(tbl)]
  select(tbl, "variable", !!!col_sel)
}
