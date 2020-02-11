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
  expect_equal(process_apipass("notafile"), "")
})

test_that("apipass_matches works", {
  api_pass_key <- "somekey"
  opts <- openssl::sha256(c("opt1", "opt2"), api_pass_key)
  expect_true(apipass_matches("opt1", api_pass_key, opts))
  expect_true(apipass_matches("opt2", api_pass_key, opts))
  expect_false(apipass_matches("notanopt", api_pass_key, opts))
})
