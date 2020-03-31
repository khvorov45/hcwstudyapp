# hcwstudyapp 0.2.0-dev

# hcwstudyapp 0.2.0

## Redesign

* Raw tables tab - contains data tables (participant, symptoms and swabs). Has filters for variables, rows per page and a download button. Also carries table-specific filters:

  * Participants - consent to additional bleed (nested study) and baseline questionnaire completeness (any/complete/incomplete).

  * Symptoms - date range, swab collection and survey completion status.

  * Swabs - orphan status (cannot link to survey).

* Summary tables tab - contains summary tables as per the statistical analysis plan.

* Plots tab - contains plots (histograms of sex, age and vaccination history). Contains font size slider and consent to additional bleed filter.

# hcwstudyapp 0.1.0

## Functionality

* Site-specific passwords

* Data update with a timestamp

* Global site filtering

* Dark/light switch

* Table rendering

  * Variable selection

  * Variable-length pages

  * Ability to download current table

* Graph rendering

  * Variable font size

* Recruitment tab

  * Histogram by vaccination history

  * Screening table

  * Filter by consent to additional bleed

* Baseline tab

  * Gender/age histograms

  * Baseline questionnaire table

 * Contact tab - participant contact information

* Symptoms tab - survey-associated table

  * Date filtering

  * Survey completion subject/row filtering

  * Swab collection status filtering

* Swabs tab - swab table

  * Orphan swab filter
