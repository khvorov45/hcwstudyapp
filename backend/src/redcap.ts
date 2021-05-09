import axios from "axios"
import * as t from "io-ts"
import { DateFromISOString } from "io-ts-types"
import {
  User,
  UserV,
  Participant,
  ParticipantV,
  YearChange,
  YearChangeV,
  Vaccination,
  VaccinationV,
  Schedule,
  ScheduleV,
  RegistrationOfInterest,
  SiteV,
  MyDateV,
  CovidVaccineBrandV,
  CovidVaccineBrand,
  SwabResultV,
  BloodSample,
  BloodSampleV,
} from "./data"
import { decode } from "./io"
import { justDateString } from "./util"

export type RedcapConfig = {
  url: string
  token2020: string
  token2021: string
}

type RedcapRequestData = {
  content: "record" | "user"
  desc: string
  type?: "flat" | "eav"
  rawOrLabel?: "raw" | "label"
  fields?: string
  events?: string
  exportDataAccessGroups?: "true" | "false"
}

/** This is type-extremely-unsafe, always decode whatever this returns */
async function redcapApiReq(
  config: RedcapConfig,
  body: RedcapRequestData
): Promise<any[]> {
  // Drop all empty fields
  const bodyNonEmpty2020: Record<string, string> = {
    token: config.token2020,
    format: "json",
  }
  const bodyNonEmpty2021: Record<string, string> = {
    token: config.token2021,
    format: "json",
  }
  Object.entries(body).map(([k, v]) => {
    if (v) {
      bodyNonEmpty2020[k] = v
      bodyNonEmpty2021[k] = v
    }
  })
  const before = new Date()
  const [year2020, year2021] = await Promise.all([
    axios.post(config.url, new URLSearchParams(bodyNonEmpty2020)),
    axios.post(config.url, new URLSearchParams(bodyNonEmpty2021)),
  ])
  const after = new Date()
  console.log(`REDCap ${body.desc} - ${after.getTime() - before.getTime()} ms`)
  return year2020.data
    .map((r: any) => {
      r.redcapProjectYear = 2020
      return r
    })
    .concat(
      year2021.data.map((r: any) => {
        r.redcapProjectYear = 2021
        return r
      })
    )
}

function uniqueRows<T extends { redcapProjectYear: number }>(
  a: T[],
  ids: (keyof T)[]
): T[] {
  function genId(v: T) {
    return ids.reduce((acc, id) => acc + v[id], "")
  }
  const allYears = Array.from(new Set(a.map((e) => e.redcapProjectYear)))
  return allYears.reduce((a, year) => {
    const aKeep = a.filter((e) => e.redcapProjectYear <= year)
    const aDrop = a.filter((e) => e.redcapProjectYear > year)
    const allCurrentYearIds = aKeep
      .filter((e) => e.redcapProjectYear === year)
      .map(genId)
    return aKeep.concat(
      aDrop.filter((e) => !allCurrentYearIds.includes(genId(e)))
    )
  }, a)
}

function processRedcapString(s: string | null | undefined): string | null {
  return s === undefined || s === null || s === "" ? null : s
}

function processRedcapBoolean(s: string | null | undefined): boolean | null {
  const step1 = processRedcapString(s)
  if (step1 === null) {
    return null
  }
  return step1 === "1"
}

function processRedcapBooleanLabel(
  s: string | null | undefined
): boolean | null {
  const step1 = processRedcapStringLower(s)
  if (step1 === null) {
    return null
  }
  return step1 === "yes"
}

function processRedcapCovidVaccineBrand(
  s: string | null | undefined
): CovidVaccineBrand | null {
  const step1 = processRedcapString(s)
  if (step1 === null) {
    return null
  }
  return step1 === "1" ? "pfizer" : step1 === "2" ? "astra" : "other"
}

function processRedcapStringLower(s: string | null | undefined): string | null {
  const p = processRedcapString(s)
  return p ? p.toLowerCase() : p
}

function processRedcapDataAccessGroup(s: string | null | undefined): string {
  return s === undefined || s === null || s === ""
    ? "unrestricted"
    : s.toLowerCase()
}

function processRedcapOccupation(
  preset: string | null | undefined,
  special: string | null | undefined
): string | null {
  if (preset === undefined || preset === null || preset === "") {
    return null
  }
  const lowpreset = preset.toLowerCase().trim()
  if (lowpreset === "allied health") {
    return "alliedHealth"
  }
  if (lowpreset === "other") {
    if (special?.toLowerCase().includes("research")) {
      return "research"
    }
    return "other"
  }
  return lowpreset
}

function processRedcapNumber(n: string | null | undefined): number | null {
  if (n === null || n === undefined || n === "") {
    return null
  }
  const nParsed = parseFloat(n)
  if (isNaN(nParsed)) {
    return null
  }
  return nParsed
}

function processPid(pid: string | null | undefined): string | null {
  const step1 = processRedcapString(pid)
  if (step1 === null) {
    return null
  }
  // The first 3 are site
  const site = step1.slice(0, 3).toUpperCase()
  // Any digits are id
  const idMatch = step1.match(/\d+/)
  if (idMatch === null) {
    return null
  }
  const id = idMatch[0]?.padStart(3, "0")
  if (id === null || id === undefined) {
    return null
  }
  return `${site}-${id}`
}

function processNested(
  consent: string,
  addBleed: string,
  studyGroupVacc: string,
  consentUnvacc: string
): boolean | null {
  if (consent === "1") {
    if (addBleed === "1") {
      return true
      // The ineligible don't see this field
    } else {
      return false
    }
  }
  if (studyGroupVacc === "2") {
    return true
  } else if (studyGroupVacc === "1") {
    return false
  }
  // Unvaccinated can only be in main
  if (consentUnvacc === "1") {
    return false
  }
  return null
}

function processSwabResult(r: any): string[] {
  const possible = Object.keys(SwabResultV.keys)
  const res = []
  for (let [key, status] of Object.entries(r)) {
    if (
      status === "0" ||
      status === null ||
      status === undefined ||
      status === ""
    ) {
      continue
    }
    let matchRes = key.match(/swab_result___(\d+)/)
    if (matchRes === null) {
      continue
    }
    let i = matchRes[1]

    res.push(possible[parseInt(i) - 1])
  }
  return res
}

export async function exportUsers(config: RedcapConfig): Promise<User[]> {
  const users = (
    await redcapApiReq(config, { content: "user", desc: "users" })
  ).map((u) => ({
    email: processRedcapStringLower(u.email),
    accessGroup: processRedcapDataAccessGroup(u.data_access_group),
    redcapProjectYear: u.redcapProjectYear,
    kind: "redcap",
    deidentifiedExport: u.data_export === 2,
  }))
  return decode(t.array(UserV), uniqueRows(users, ["email"]))
}

/** Handle special cases for participants
 *
 * WCH-025 became WCH-818
 */
function participantsSpecial(ps: Participant[]): Participant[] {
  return ps.filter((p) => p.pid !== "WCH-025")
}

export async function exportParticipants(
  config: RedcapConfig
): Promise<Participant[]> {
  const records = (
    await redcapApiReq(config, {
      content: "record",
      desc: "participants",
      fields: [
        "redcap_data_access_group",
        "pid",
        "date_screening",
        "email",
        "mobile_number",
        "a1_gender",
        "a2_dob",
        "a3_atsi",
        "a5_height",
        "a6_weight",
        "c3_occupation",
        "c3_spec",
        "baseline_questionnaire_complete",
      ].toString(),
      events: "baseline_arm_1",
      type: "flat",
      rawOrLabel: "label",
      exportDataAccessGroups: "true",
    })
  )
    .map((r: any) => ({
      pid: processPid(r.pid),
      site: processRedcapDataAccessGroup(r.redcap_data_access_group),
      dateScreening: processRedcapString(r.date_screening),
      email: processRedcapStringLower(r.email),
      mobile: processRedcapString(r.mobile_number),
      gender: processRedcapStringLower(r.a1_gender),
      dob: processRedcapString(r.a2_dob),
      baselineQuestComplete: r.baseline_questionnaire_complete === "Complete",
      redcapProjectYear: r.redcapProjectYear,
      heightCM: processRedcapNumber(r.a5_height),
      weightKG: processRedcapNumber(r.a6_weight),
      occupation: processRedcapOccupation(r.c3_occupation, r.c3_spec),
      atsi: processRedcapBooleanLabel(r.a3_atsi),
    }))
    .filter((r) => r.pid)

  return participantsSpecial(
    decode(t.array(ParticipantV), uniqueRows(records, ["pid"]))
  )
}

export async function exportYearChanges(
  config: RedcapConfig
): Promise<YearChange[]> {
  const redcapIds = (
    await redcapApiReq(config, {
      content: "record",
      desc: "redcap ids",
      fields: [
        "record_id",
        "pid",
        "consent",
        "add_bleed",
        "study_group_vacc",
        "consent_unvacc",
      ].toString(),
      events: "baseline_arm_1",
      type: "flat",
      rawOrLabel: "raw",
      exportDataAccessGroups: "false",
    })
  )
    .map((r: any) => ({
      redcapRecordId: processRedcapString(r.record_id),
      pid: processPid(r.pid),
      pidPreformat: processRedcapString(r.pid),
      nested: processNested(
        r.consent,
        r.add_bleed,
        r.study_group_vacc,
        r.consent_unvacc
      ),
      redcapProjectYear: r.redcapProjectYear,
    }))
    .filter((r) => r.pid)
  // We should never have the same id-year combination, can trust REDCap on that
  return decode(t.array(YearChangeV), redcapIds)
}

const RedcapWithdrawnV = t.type({
  redcapRecordId: t.string,
  redcapProjectYear: t.number,
  date: DateFromISOString,
})
type RedcapWithdrawn = t.TypeOf<typeof RedcapWithdrawnV>

export async function exportWithdrawn(
  config: RedcapConfig
): Promise<RedcapWithdrawn[]> {
  const withdrawn = (
    await redcapApiReq(config, {
      content: "record",
      desc: "withdrawn",
      fields: ["record_id", "withdrawn", "withdrawal_date"].toString(),
      events: "withdrawal_arm_1",
      type: "flat",
      rawOrLabel: "raw",
      exportDataAccessGroups: "false",
    })
  )
    .map((r: any) => ({
      redcapRecordId: processRedcapString(r.record_id),
      redcapProjectYear: r.redcapProjectYear,
      withdrawn: r.withdrawn === "1",
      date: processRedcapString(r.withdrawal_date),
    }))
    .filter((r) => r.withdrawn)
  // The same id can presumably not be withdrawn in different years?
  // That's what the database assumes at the moment
  return decode(t.array(RedcapWithdrawnV), withdrawn)
}

export async function exportVaccination(
  config: RedcapConfig
): Promise<Vaccination[]> {
  const years = [2015, 2016, 2017, 2018, 2019, 2020]
  const varNames = years.map((y) => `vac_${y}`)
  const vacLong: any[] = []

  const [screeningHistory, studyYearVaccination] = await Promise.all([
    redcapApiReq(config, {
      content: "record",
      desc: "vaccination (screening)",
      fields: ["record_id", "pid", ...varNames].toString(),
      events: "baseline_arm_1",
      type: "flat",
      rawOrLabel: "label",
      exportDataAccessGroups: "false",
    }),
    redcapApiReq(config, {
      content: "record",
      desc: "vaccination (study year)",
      fields: ["record_id", "vaccinated"].toString(),
      events: "vaccination_arm_1",
      type: "flat",
      rawOrLabel: "label",
      exportDataAccessGroups: "false",
    }),
  ])

  screeningHistory.forEach((v) =>
    years.reduce((vacLongCurrent, year) => {
      if (!v.pid) {
        return vacLongCurrent
      }
      vacLongCurrent.push({
        pid: processPid(v.pid),
        year: year,
        status:
          processRedcapStringLower(v[`vac_${year}`])?.replace("yes - ", "") ??
          null,
        redcapProjectYear: v.redcapProjectYear,
        redcapRecordId: v.record_id,
      })
      return vacLongCurrent
    }, vacLong)
  )

  studyYearVaccination.forEach((r) => {
    const pid = vacLong.find(
      (v) =>
        v.redcapProjectYear === r.redcapProjectYear &&
        v.redcapRecordId === r.record_id
    )?.pid
    if (!pid) {
      return
    }
    const status =
      r.vaccinated === "" || r.vaccinated === null || r.vaccinated === undefined
        ? "unknown"
        : r.vaccinated === "Yes"
        ? "australia"
        : "no"
    const existingEntryIndex = vacLong.findIndex(
      (v) => v.pid === pid && v.year === r.redcapProjectYear
    )
    if (existingEntryIndex === -1) {
      vacLong.push({
        pid,
        status,
        year: r.redcapProjectYear,
        redcapProjectYear: r.redcapProjectYear,
      })
    } else {
      vacLong[existingEntryIndex].status = status
    }
  })

  return decode(t.array(VaccinationV), uniqueRows(vacLong, ["pid", "year"]))
}

export async function exportSchedule(
  config: RedcapConfig
): Promise<Schedule[]> {
  const days = [0, 7, 14, 280]
  const varNames = days.map((d) => `scheduled_date_v${d}`)
  const scheduleLong: any[] = []

  const _ = (
    await redcapApiReq(config, {
      content: "record",
      desc: "schedule",
      fields: ["pid", ...varNames].toString(),
      events: "baseline_arm_1",
      type: "flat",
      rawOrLabel: "raw",
      exportDataAccessGroups: "false",
    })
  ).map((r: any) => {
    days.reduce((scheduleLongCurrent, day) => {
      if (!r.pid) {
        return scheduleLongCurrent
      }
      scheduleLongCurrent.push({
        pid: processPid(r.pid),
        day: day,
        redcapProjectYear: r.redcapProjectYear,
        date: processRedcapString(r[`scheduled_date_v${day}`]),
      })
      return scheduleLongCurrent
    }, scheduleLong)
  })
  // Year is part of the key, no need to worry about uniqueness probably
  return decode(t.array(ScheduleV), scheduleLong)
}

export const RedcapWeeklySurveyV = t.type({
  redcapRecordId: t.string,
  redcapProjectYear: t.number,
  index: t.number,
  date: t.union([DateFromISOString, t.null]),
  ari: t.boolean,
  swabCollection: t.union([t.boolean, t.null]),
  swabResult: t.array(SwabResultV),
})
export type RedcapWeeklySurvey = t.TypeOf<typeof RedcapWeeklySurveyV>

export const RedcapVaccinationCovidV = t.type({
  redcapRecordId: t.string,
  redcapProjectYear: t.number,
  year: t.number,
  dose: t.number,
  date: t.union([MyDateV, t.null]),
  brand: t.union([CovidVaccineBrandV, t.null]),
  brandOther: t.union([t.string, t.null]),
  batch: t.union([t.string, t.null]),
  surveyIndex: t.union([t.number, t.null]),
})
export type RedcapVaccinationCovid = t.TypeOf<typeof RedcapVaccinationCovidV>

export async function exportWeeklySurvey(
  config: RedcapConfig
): Promise<{
  weeklySurvey: RedcapWeeklySurvey[]
  vaccinationCovid: RedcapVaccinationCovid[]
}> {
  const surv = (
    await redcapApiReq(config, {
      content: "record",
      desc: "weekly survey",
      fields: [
        "record_id",
        "ari_definition",
        "date_symptom_survey",
        "swab_collection",
        "swab_result",
        "recent_covax",
        "covax_rec",
        "covax_rec_other",
        "covax_dose",
        "covax_date",
        "covax_batch",
      ].toString(),
      events: Array.from(Array(52).keys())
        .map((n) => `weekly_survey_${n + 1}_arm_1`)
        .toString(),
      type: "flat",
      rawOrLabel: "raw",
      exportDataAccessGroups: "false",
    })
  ).map((r) => ({
    ari: processRedcapBoolean(r.ari_definition),
    swabCollection: processRedcapBoolean(r.swab_collection),
    swabResult: processSwabResult(r),
    covidVaccineReceived: processRedcapBoolean(r.recent_covax),
    brand: processRedcapCovidVaccineBrand(r.covax_rec),
    brandOther: processRedcapString(r.covax_rec_other),
    dose: processRedcapNumber(r.covax_dose),
    covidVaccineDate: processRedcapString(r.covax_date),
    batch: processRedcapString(r.covax_batch),
    redcapRecordId: r.record_id,
    redcapProjectYear: r.redcapProjectYear,
    index: parseInt(r.redcap_event_name.match(/weekly_survey_(\d+)_arm_1/)[1]),
    date: processRedcapString(r.date_symptom_survey),
  }))

  const vaccinationCovid = decode(
    t.array(RedcapVaccinationCovidV),
    surv
      .filter((s) => s.covidVaccineReceived)
      .map((s) => ({
        redcapRecordId: s.redcapRecordId,
        redcapProjectYear: s.redcapProjectYear,
        year: s.redcapProjectYear,
        dose: s.dose,
        date: s.covidVaccineDate,
        brand: s.brand,
        brandOther: s.brandOther,
        batch: s.batch,
        surveyIndex: s.index,
      }))
  )

  await sendCovidVaccination(config, vaccinationCovid)

  return {
    weeklySurvey: decode(
      t.array(RedcapWeeklySurveyV),
      surv.filter((r) => r.ari !== null)
    ),
    vaccinationCovid,
  }
}

export async function sendRoi(
  config: RedcapConfig,
  roi: RegistrationOfInterest[]
) {
  const before = new Date()
  const res = await axios.post(
    config.url,
    new URLSearchParams({
      token: config.token2021,
      format: "json",
      content: "record",
      data: JSON.stringify(
        roi.map((r, i) => ({
          record_id: i,
          roi_site: (
            Object.keys(SiteV.keys).findIndex((k) => k === r.site) + 1
          ).toString(),
          roi_name: r.name,
          roi_mobile: r.mobile,
          roi_email: r.email,
        }))
      ),
      forceAutoNumber: "true",
    }),
    { validateStatus: () => true }
  )
  console.log(res.data)
  const after = new Date()
  console.log(`REDCap send ROI - ${after.getTime() - before.getTime()} ms`)
}

export async function sendCovidVaccination(
  config: RedcapConfig,
  data: RedcapVaccinationCovid[]
) {
  const before = new Date()
  const res = await axios.post(
    config.url,
    new URLSearchParams({
      token: config.token2021,
      format: "json",
      content: "record",
      data: JSON.stringify(
        data.map((r, i) => ({
          record_id: r.redcapRecordId,
          redcap_event_name: "vaccination_arm_1",
          covid_vac_brand:
            r.brand === "pfizer" ? 1 : r.brand === "astra" ? 2 : 3,
          other_covax_brand: r.brandOther,
          covid_vac_dose1_rec: r.dose === 1 ? "1" : "",
          covid_vac_dose2_rec: r.dose === 2 ? "2" : "",
          covid_vacc_date1: r.dose === 1 ? justDateString(r.date) : "",
          covid_vacc_date2: r.dose === 2 ? justDateString(r.date) : "",
          covid_vac_batch1: r.dose === 1 ? r.batch : "",
          covid_vac_batch2: r.dose === 2 ? r.batch : "",
          covid_vac_survey_index: r.surveyIndex,
        }))
      ),
    }),
    { validateStatus: () => true }
  )
  console.log(res.data)
  const after = new Date()
  console.log(
    `REDCap send covid vaccination - ${after.getTime() - before.getTime()} ms`
  )
}

export async function exportWeeklySurveyLink(
  config: RedcapConfig,
  redcapRecordId: string,
  index: number
) {
  const res = await axios.post(
    config.url,
    new URLSearchParams({
      token: config.token2021,
      returnFormat: "json",
      content: "surveyLink",
      record: redcapRecordId,
      instrument: "weekly_symptom_survey",
      event: `weekly_survey_${index}_arm_1`,
    })
  )
  return await res.data
}

export async function exportBloodSamples(
  config: RedcapConfig
): Promise<BloodSample[]> {
  const bloodSamplesWide = await redcapApiReq(config, {
    content: "record",
    desc: "blood sample",
    fields: [
      "pid",
      "date_baseline_blood",
      "date_7d_blood",
      "date_14d_blood",
      "date_end_season_blood",
    ].toString(),
    events: "baseline_arm_1",
    type: "flat",
    rawOrLabel: "raw",
    exportDataAccessGroups: "false",
  })
  const bloodSamples: any[] = []
  for (let bloodSampleWide of bloodSamplesWide) {
    const pid = processPid(bloodSampleWide.pid)
    if (pid === null) {
      continue
    }
    const year = bloodSampleWide.redcapProjectYear
    const baselineDate = processRedcapString(
      bloodSampleWide.date_baseline_blood
    )
    const day7Date = processRedcapString(bloodSampleWide.date_7d_blood)
    const day14Date = processRedcapString(bloodSampleWide.date_14d_blood)
    const postSeasonDate = processRedcapString(
      bloodSampleWide.date_end_season_blood
    )
    if (baselineDate !== null) {
      bloodSamples.push({
        pid,
        year,
        timepoint: "prevax",
        date: baselineDate,
      })
    }
    if (day7Date !== null) {
      bloodSamples.push({
        pid,
        year,
        timepoint: "postvax7d",
        date: day7Date,
      })
    }

    if (day14Date !== null) {
      bloodSamples.push({
        pid,
        year,
        timepoint: "postvax14d",
        date: day14Date,
      })
    }

    if (postSeasonDate !== null) {
      bloodSamples.push({
        pid,
        year,
        timepoint: "postseason",
        date: postSeasonDate,
      })
    }
  }
  return decode(t.array(BloodSampleV), bloodSamples)
}
