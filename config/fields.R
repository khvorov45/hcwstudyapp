library(tidyverse)

fields <- RCurl::postForm(
  "https://biredcap.mh.org.au/api/",
  token = yaml::read_yaml("config/config.yaml")$db$redcap$token,
  content = "exportFieldNames",
  format = "json"
) %>%
  jsonlite::fromJSON() %>%
  as_tibble()

dat <- RCurl::postForm(
  "https://biredcap.mh.org.au/api/",
  token = yaml::read_yaml("config/config.yaml")$db$redcap$token,
  content = "record",
  format = "json",
  fields = "record_id,redcap_event_name,ari_definition,survey_week",
  exportDataAccessGroups = TRUE
) %>%
  jsonlite::fromJSON() %>%
  as_tibble()

dat %>%
  filter(survey_week != "")
