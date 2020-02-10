test_that("run_app works", {
  expect_error(
    run_app("data-raw/token-alt"),
    class = "token_mismatch"
  )
})
