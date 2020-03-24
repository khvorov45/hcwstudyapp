#' Tab with widgets to view recruitment by vaccination history
#' @noRd
ui_recruitvh <- function(id = "recruitvh", label = "Recruitment") {
  ns <- NS(id)
  ui_plotpanel(
    ns("plotpanel"), label,
    data_ui = list(
      ui_binfilt(ns("binfilt"), "Consent to additional bleed", "add_bleed")
    )
  )
}

#' Server for recruitvh
#'
#' @param input,output,session Standard
#' @param dat REDCap data (list of tables, subset by access group elsewhere)
#'
#' @import ggplot2
#'
#' @noRd
server_recruitvh <- function(input, output, session, dat, dark) {
  tbl <- reactive(inner_join(
    dat()$participant_essential, dat()$participant_recruit, "record_id"
  ))
  tbl_filt <- callModule(server_binfilt, "binfilt", tbl, "add_bleed")
  table_html <- reactive(table_recruitvh(
    inner_join(tbl_filt(), dat()$participant_baseline, "record_id")
  ))
  callModule(
    server_plotpanel, "plotpanel", tbl_filt, dark, plot_recruitvh,
    table_html,
    data_name = "screening"
  )
}

plot_recruitvh <- function(dat, fontsize, dark) {
  dat %>%
    mutate(
      num_seas_vac_fct = factor(.data$num_seas_vac, levels = 0:5) %>%
        forcats::fct_explicit_na()
    ) %>%
    count(.data$num_seas_vac_fct) %>%
    plot_col(
      fontsize, dark, "num_seas_vac_fct", "n",
      "Number of seasons vaccinated",
      "Number recruited"
    )
}

table_recruitvh <- function(dat) {
  dat <- mutate(
    dat,
    num_seas_vac_fct = factor(.data$num_seas_vac, levels = 0:5) %>%
      forcats::fct_explicit_na(),
    age_group = as.character(cut(
      .data$age_screening, c(-Inf, 35, 60, Inf),
      right = FALSE
    ))
  )
  col_ord <- c("0", "1", "2", "3", "4", "5", "(Missing)")
  tbl_site <- table_recruitvh_gen(dat, col_ord, "site_name")
  tbl_sex <- table_recruitvh_gen(dat, col_ord, "a1_gender")
  tbl_agegrp <- table_recruitvh_gen(dat, col_ord, "age_group")
  tbl_total <- tbl_site %>%
    mutate(variable = "Total") %>%
    group_by(.data$variable) %>%
    summarise_all(sum, na.rm = TRUE)
  tbl_total %>%
    bind_rows(tbl_site) %>%
    bind_rows(tbl_sex) %>%
    bind_rows(tbl_agegrp) %>%
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
      index = c(
        "",
        "Site" = nrow(tbl_site),
        "Sex" = nrow(tbl_sex),
        "Age group" = nrow(tbl_agegrp)
      ),
      label_row_css = "border-color: #666"
    )
}

table_recruitvh_gen <- function(tbl, col_ord, var_name) {
  tbl <- tbl %>%
    mutate(
      !!rlang::sym(var_name) := if_else(
        is.na(!!rlang::sym(var_name)), "(Missing)", !!rlang::sym(var_name)
      )
    ) %>%
    count(!!rlang::sym(var_name), .data$num_seas_vac_fct) %>%
    tidyr::pivot_wider(
      names_from = .data$num_seas_vac_fct, values_from = .data$n
    )
  col_sel <- col_ord[col_ord %in% colnames(tbl)]
  select(tbl, "variable" = !!rlang::sym(var_name), !!!col_sel)
}
