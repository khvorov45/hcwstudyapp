# hcwstudyapp

Web app for views into REDCap database.

## Deployment

Rename `config-template.yaml` to `config.yaml` and fill in the missing fields

```shell
npm install
npm run build
npm start
```

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

[Github](https://github.com/khvorov45/hcwstudyapp)
