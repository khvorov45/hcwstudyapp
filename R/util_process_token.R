process_token <- function(token_opt) {
  if (is.null(token_opt) | !is.character(token_opt))
    rlang::abort(
      glue::glue(
        "cannot access RedCap without token, use run_app(token = tok)\n",
        "where 'tok' is either a string or path to a text file ",
        "containing the token"
      ),
      class = "wrong_token"
    )
  if (file.exists(token_opt))
    token_opt <- readChar(token_opt, file.info(token_opt)$size)
  stringr::str_trim(token_opt)
}
