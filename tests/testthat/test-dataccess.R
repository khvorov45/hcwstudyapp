skip_if_no_tok <- function(tok) {
  skip_if(tok == "", message = "REDAPITOK not set, skipping test")
}

skip_if_no_dat <- function(dat) {
  skip_if(identical(dat, tibble()), "No data in REDCap")
}

tok <- Sys.getenv("REDAPITOK")
uri <- "https://biredcap.mh.org.au/api/"

test_that("RedCap download and reformatting works", {
  skip_if_no_tok(tok)

  dat <- get_redcap_data(tok, uri)
  expect_equal(class(dat), c("tbl_df", "tbl", "data.frame"))

  nocons <- dat %>%
    filter(redcap_event_name == "Baseline") %>%
    select(
      record_id, "consent", "consent_unvacc", "study_group_vacc"
    ) %>%
    filter(is.na(consent) | consent == "No") %>%
    filter(is.na(consent_unvacc) | consent_unvacc == "No") %>%
    filter(is.na(study_group_vacc))

  skip_if_no_dat(dat)

  dat_ref <- reformat_cols(dat)

  part <- get_tbl_participant(dat_ref)
  expect_equal(class(part), c("tbl_df", "tbl", "data.frame"))
  expect_equal(nrow(part), length(unique(part$record_id)))

  sympt <- get_tbl_symptom(dat_ref)
  expect_equal(class(sympt), c("tbl_df", "tbl", "data.frame"))

  swab <- get_tbl_swab(dat_ref)
  expect_equal(class(swab), c("tbl_df", "tbl", "data.frame"))

  all_tbls <- get_tbls(dat_ref)
  expect_named(
    all_tbls,
    c(
      "participant",
      "participant_essential", "participant_recruit", "participant_baseline",
      "symptom", "swab", "withdrawal"
    )
  )

  all_tbls2 <- down_trans_redcap(tok, uri, "all")
})

test_that("Subsetting by access_group works", {
  skip_if_no_tok(tok)
  dat <- get_redcap_data(tok, uri)
  skip_if_no_dat(dat)
  for (access_group in names(site_altnames)) {
    dat_lim <- redcap_subset(dat, access_group)
    if (nrow(dat_lim) == 0) next
    expect_equal(
      dat_lim %>%
        group_by(record_id) %>%
        summarise(site_name = unique(stats::na.omit(site_name))) %>%
        pull(site_name) %>%
        unique(),
      get_site_name(access_group)
    )
  }
  dat_extra_site <- bind_rows(dat, tibble(site_name = "extra_site"))
  expect_error(
    redcap_subset(dat_extra_site, "adelaide"),
    class = "redcap_extra_sites"
  )
  dat_empty <- redcap_subset(dat, "none")
  expect_equal(colnames(dat_empty), colnames(dat))
  expect_equal(nrow(dat_empty), 0)
})

test_that("access group fails when group isn't recognised", {
  expect_error(
    get_site_name("unknown_group"),
    class = "unknown_access_group"
  )
})

test_that("Alternative variable names are variables", {
  skip_if_no_tok(tok)
  dat <- get_redcap_data(tok, uri)
  skip_if_no_dat(dat)
  expect_true(all(names(var_altnames) %in% colnames(dat)))
})

test_that("redcap_to_listcol works", {
  dummy <- tibble(
    var1___1 = c("Checked", "Checked", "Unchecked", NA),
    var1___2 = c("Checked", "Unchecked", "Unchecked", NA)
  )
  dummy_alt <- c("1" = "one", "2" = "two")
  expect_equal(
    redcap_to_listcol("var1", dummy_alt, dummy),
    list(
      c("one", "two"), "one", NA, NA
    )
  )
})
