library(testthat)
library(hcwstudyapp)

process_token_error <- function(input) {
  expect_error(
    process_token(NULL),
    class = "wrong_token"
  )
}

test_that("process_token works", {
  purrr::walk(
    list(NULL, 123),
    process_token_error
  )
  withr::with_tempfile(
    "temptok", {
      write("   ABC123\r\n  ", temptok)
      expect_equal(process_token(temptok), "ABC123")
    }
  )
  expect_equal(process_token("   ABC123\r\n  "), "ABC123")
})
