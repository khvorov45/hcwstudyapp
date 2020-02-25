test_that("run_app works", {
  withr::with_tempfile(c("token", "key"), {
    write("wrong_key", key)
    write("wrong_token", token)
    expect_error(
      run_app(token, key),
      class = "token_key_mismatch"
    )
  })
})
