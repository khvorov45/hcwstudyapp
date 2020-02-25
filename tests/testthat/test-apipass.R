test_that("apipass_matches works", {
  api_pass_key <- "somekey"
  opts <- openssl::sha256(c("opt1", "opt2"), api_pass_key)
  expect_true(apipass_matches("opt1", api_pass_key, opts))
  expect_true(apipass_matches("opt2", api_pass_key, opts))
  expect_false(apipass_matches("notanopt", api_pass_key, opts))
})

test_that("find_apipass_match works", {
  fake_hashes <- tibble(
    access = c("fake1", "fake2"),
    hash = openssl::sha256(c("fakepass1", "fakepass2"), "fakekey")
  )
  expect_equal(find_apipass_match("fakepass1", "fakekey", fake_hashes), "fake1")
  expect_equal(find_apipass_match("wrong", "fakekey", fake_hashes), "none")
})
