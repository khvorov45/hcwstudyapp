# HCW flu study reports app instructions

## Top row

* Homepage links to the [homepage](https://hcwflustudy.com/index.html) of the study website.
* Source links the [source code](https://github.com/khvorov45/hcwstudyapp) of the app.

## Second row

* Input your password, click on "Update password". The data will update automatically upon correct password input.
* Use the "Update data" button if there are any changes to the data that happened after the password was input. There is a timestamp next to the data button showing when the last data update occurred.
* Site drop-down menu should only have one choice if you use your site-specific password
* Dark-light switch is next to the site drop-down. It switches between dark and light themes.

## Raw tables

Shows tables pulled from REDCap.

* Click on column name to order by that column.
* Select variables from the "Variables" drop-down.
* Choose the number of rows presented on each page.
* "Download" button lets you download the current data.

### Participants

Table with 1 row per participant and everything each participant has 1 of (e.g., age at recruitment).

* Filter by consent to additional bleed (i.e., nested study membership)
* Filter by whether or not they completed the baseline questionnaire.

### Symptom surveys

Table with one row per participant per symptom survey.

* Filter by date range
* Filter by whether or not a swab was collected
* Filter by survey completion status

### Swabs

Table with one row per participant per swab. When swab data is entered, the date of the survey that prompted the collection needs to be specified manually. If the survey date entered on the swab form does no match any survey date for that participant, the swab cannot be linked to a symptom survey. Hence it becomes an "orphan" swab.

## Summary tables

Shows summary tables as per the statistical analysis plan.

## Plots

Shows visual summaries of the data.

* Control plot font size
* Filter by consent to additional bleed (i.e., nested study membership)

## Potential problems

The app can become unresponsive (e.g., tables won't load, dark/light switch may not be working) and the UI elements can display incorrectly (e.g., on top of each other). Refreshing the page usually fixes this.
