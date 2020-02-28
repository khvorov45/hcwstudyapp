skip_if_no_tok <- function(tok) {
  skip_if(tok == "", message = "REDAPITOK not set, skipping test")
}

tok <- Sys.getenv("REDAPITOK")
uri <- "https://biredcap.mh.org.au/api/"

test_that("RedCap download and reformatting works", {
  skip_if_no_tok(tok)

  dat <- get_redcap_data(tok, uri)
  expect_equal(class(dat), c("tbl_df", "tbl", "data.frame"))

  dat_ref <- reformat_cols(dat)
  expect_equal(names(dat_ref), names(dat))

  expect_equal(redcap_subset(dat_ref, "all"), dat_ref)

  part <- get_tbl_participant(dat_ref)
  expect_equal(class(part), c("tbl_df", "tbl", "data.frame"))
  expect_equal(nrow(part), length(unique(part$record_id)))

  sympt <- get_tbl_symptom(dat_ref)
  expect_equal(class(sympt), c("tbl_df", "tbl", "data.frame"))

  swab <- get_tbl_swab(dat_ref)
  expect_equal(class(swab), c("tbl_df", "tbl", "data.frame"))

  all_tbls <- get_tbls(dat_ref)
  expect_named(all_tbls, c("participant", "symptom", "swab"))

  all_tbls2 <- down_trans_redcap(tok, uri, "all")
  expect_equal(all_tbls, all_tbls2)
})

test_that("Subsetting by access_group works", {
  skip_if_no_tok(tok)
  dat <- get_redcap_data(tok, uri)
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
