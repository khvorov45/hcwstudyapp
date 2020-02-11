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
})
