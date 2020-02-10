library(testthat)
library(hcwstudyapp)

process_apipass_error <- function(input) {
  expect_error(
    process_apipass(NULL),
    class = "wrong_apipass"
  )
}

test_that("process_apipass works", {
  purrr::walk(
    list(NULL, 123),
    process_apipass_error
  )
  withr::with_tempfile(
    "temptok", {
      write("   ABC123\r\n  ", temptok)
      expect_equal(process_apipass(temptok), "ABC123")
    }
  )
  expect_equal(process_apipass("   ABC123\r\n  "), "ABC123")
})
