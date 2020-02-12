test_that("RedCap download works", {
  tok <- Sys.getenv("REDAPITOK")
  skip_if(tok == "", message = "REDAPITOK not set, skipping test")
  dat <- get_redcap_data(tok)
  expect_equal(class(dat), c("tbl_df", "tbl", "data.frame"))
  dat_ref <- reformat_cols(dat)
  expect_equal(names(dat_ref), names(dat))
  dat_list <- raw_to_list(dat_ref)
  expect_equal(
    names(dat_list),
    stringr::str_replace(unique(dat_ref$redcap_event_name), "_arm_1", "")
  )
  part <- get_tbl_participant(dat_list$baseline)
  expect_equal(class(part), c("tbl_df", "tbl", "data.frame"))
  all_tbls <- get_tbls(dat_list)
  expect_named(all_tbls, c("participant"))
})
