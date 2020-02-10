process_apipass <- function(pass_opt) {
  if (is.null(pass_opt) | !is.character(pass_opt))
    rlang::abort(
      glue::glue(
        "pass_opt should be a string or path to text file\n",
      ),
      class = "wrong_apipass"
    )
  if (file.exists(pass_opt))
    pass_opt <- readChar(pass_opt, file.info(pass_opt)$size)
  stringr::str_trim(pass_opt)
}
