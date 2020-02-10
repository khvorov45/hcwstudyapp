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
  opts <- purrr::map_chr(c("opt1", "opt2"), ~ openssl::sha256(.x, api_pass_key))
  expect_true(apipass_matches("opt1", opts))
  expect_true(apipass_matches("opt2", opts))
  expect_false(apipass_matches("notanopt", opts))
})
