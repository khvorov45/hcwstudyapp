# General

- There is a theme switch button in the top-right.

- The update button pulls data from REDCap. Once someone clicks it, the data
  is updated for all users.

- The data is filtered to the non-withdrawn by default.

# Tables

- The ribbon under the navigation bars has the update button, site selection
  (if you've got unrestricted access) and variable selection.

- The strip under the ribbon has the download button, row count and pagination
  control.

- Columns can be sorted by clicking on their names.

- The gray name is the REDCap name (if present).

- Columns can be filtered by using the element under the column name.

## Contact

Participant contact information. Also present in other tables but hidden by
default.

## Baseline

Information from the baseline survey.

## Schedule

Scheduled dates as per the REDCap scheduling instrument.

## Weekly survey

Information from the weekly surveys.

## Weekly completion

Completion of weekly surveys. The 'Recruited' column shows the week index
which corresponds to when
the particpant was recruited. The current week index is on the strip under
the ribbon.

# Plots

Histograms of Age, Gender and previous vaccinations.

# Summary

Summary table of counts of participants by site and vaccination history with
marginal sums.

# API

|  Type  |         Location         |                               Action                                |              Body (URL encoded)               |
| :----: | :----------------------: | :-----------------------------------------------------------------: | :-------------------------------------------: |
| `GET`  |  `api/getparticipants`   |                 Get `json` of the participant table                 |  `email` `token` `accessGroup`\* `subset`\*   |
| `GET`  |     `api/getsummary`     |                   Get `json` of the summary table                   | `email` `token` `accessGroup`\* `withdrawn`\* |
| `GET`  | `api/getuseraccessgroup` |             Get `json` of the given user's access group             |                `email` `token`                |
| `GET`  |       `api/update`       |               Get `json` of the last database update                |                                               |
| `POST` |       `api/update`       | Performs the database update. Also returns `json` of the timestamp. |                `email` `token`                |
| `POST` |   `api/sendaccesslink`   |              Sends the access link to the given email.              |                    `email`                    |
| `POST` |   `api/authoriseuser`    |       Returns boolean `json` with user's authorisation status       |                `email` `token`                |


\* marks optional fields

`token` can be found in the given URL.

`accessGroup` can be only be used by users with unrestricted access and can be
one of `admin`, `unrestricted`,
`melbourne`, `adelaide`, `sydney`, `newcastle`, `perth`, `brisbane`.

`subset` can be one of `contact`, `baseline`, `schedule-long`, `schedule-wide`,
`weeklysurvey`, `weeklycompletion`.

`withdrawn` can be one of `yes`, `no`, `any`.

# Source

[Github](https://github.com/khvorov45/hcwstudyapp).
