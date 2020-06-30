library(tidyverse)

fields <- RCurl::postForm(
  "https://biredcap.mh.org.au/api/",
  token = yaml::read_yaml("config/config.yaml")$db$redcap$token,
  content = "exportFieldNames",
  format = "json"
) %>%
  jsonlite::fromJSON() %>%
  as_tibble()
