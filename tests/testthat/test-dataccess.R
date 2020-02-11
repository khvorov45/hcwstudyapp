test_that("RedCap download works", {
  tok <- Sys.getenv("REDAPITOK")
  skip_if(tok == "", message = "REDAPITOK not set, skipping test")
  dat <- get_redcap_data(tok)
  expect_equal(class(dat), c("tbl_df", "tbl", "data.frame"))
})
