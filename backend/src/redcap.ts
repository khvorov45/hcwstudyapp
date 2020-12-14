import axios from "axios"
import * as t from "io-ts"
import { DateFromISOString } from "io-ts-types"
import {
  User,
  UserV,
  Participant,
  ParticipantV,
  RedcapId,
  RedcapIdV,
  Vaccination,
  VaccinationV,
  Schedule,
  ScheduleV,
} from "./data"
import { decode } from "./io"

export type RedcapConfig = {
  url: string
  token2020: string
  token2021: string
}

type RedcapRequestData = {
  [index: string]: string | undefined
  content: "record" | "user"
  type?: "flat" | "eav"
  rawOrLabel?: "raw" | "label"
  fields?: string
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
  const [year2020, year2021] = await Promise.all([
    axios.post(config.url, new URLSearchParams(bodyNonEmpty2020)),
    axios.post(config.url, new URLSearchParams(bodyNonEmpty2021)),
  ])
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
  id: keyof T
): T[] {
  const allYears = Array.from(new Set(a.map((e) => e.redcapProjectYear)))
  return allYears.reduce((a, year) => {
    const aKeep = a.filter((e) => e.redcapProjectYear <= year)
    const aDrop = a.filter((e) => e.redcapProjectYear > year)
    const allCurrentYearIds = aKeep
      .filter((e) => e.redcapProjectYear === year)
      .map((e) => e[id])
    return aKeep.concat(aDrop.filter((e) => !allCurrentYearIds.includes(e[id])))
  }, a)
}

function processRedcapString(s: string | null | undefined): string | null {
  return s === undefined || s === null || s === "" ? null : s
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

export async function exportUsers(config: RedcapConfig): Promise<User[]> {
  const users = (await redcapApiReq(config, { content: "user" })).map((u) => ({
    email: processRedcapStringLower(u.email),
    accessGroup: processRedcapDataAccessGroup(u.data_access_group),
    redcapProjectYear: u.redcapProjectYear,
  }))
  return decode(t.array(UserV), uniqueRows(users, "email"))
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
      fields: [
        "redcap_data_access_group",
        "pid",
        "date_screening",
        "email",
        "mobile_number",
        "a1_gender",
        "a2_dob",
        "add_bleed",
        "study_group_vacc",
        "baseline_questionnaire_complete",
      ].toString(),
      events: "baseline_arm_1",
      type: "flat",
      rawOrLabel: "label",
      exportDataAccessGroups: "true",
    })
  )
    .map((r: any) => ({
      pid: processRedcapString(r.pid),
      site: processRedcapDataAccessGroup(r.redcap_data_access_group),
      dateScreening: processRedcapString(r.date_screening),
      email: processRedcapStringLower(r.email),
      mobile: processRedcapString(r.mobile_number),
      addBleed: r.add_bleed === "Yes" || r.study_group_vacc === "Nested study",
      gender: processRedcapStringLower(r.a1_gender),
      dob: processRedcapString(r.a2_dob),
      baselineQuestComplete: r.baseline_questionnaire_complete === "Complete",
      redcapProjectYear: r.redcapProjectYear,
    }))
    .filter((r) => r.pid)

  return participantsSpecial(
    decode(t.array(ParticipantV), uniqueRows(records, "pid"))
  )
}

export async function exportRedcapIds(
  config: RedcapConfig
): Promise<RedcapId[]> {
  const redcapIds = (
    await redcapApiReq(config, {
      content: "record",
      fields: ["record_id", "pid"].toString(),
      events: "baseline_arm_1",
      type: "flat",
      rawOrLabel: "raw",
      exportDataAccessGroups: "false",
    })
  )
    .map((r: any) => ({
      redcapRecordId: processRedcapString(r.record_id),
      pid: processRedcapString(r.pid),
      redcapProjectYear: r.redcapProjectYear,
    }))
    .filter((r) => r.pid)

  return decode(t.array(RedcapIdV), redcapIds)
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

  return decode(t.array(RedcapWithdrawnV), withdrawn)
}

export async function exportVaccination(
  config: RedcapConfig
): Promise<Vaccination[]> {
  const years = [2015, 2016, 2017, 2018, 2019, 2020]
  const varNames = years.map((y) => `vac_${y}`)
  const vacLong: any[] = []

  const _ = (
    await redcapApiReq(config, {
      content: "record",
      fields: ["pid", ...varNames].toString(),
      events: "baseline_arm_1",
      type: "flat",
      rawOrLabel: "label",
      exportDataAccessGroups: "false",
    })
  ).map((v) =>
    years.reduce((vacLongCurrent, year) => {
      if (!v.pid) {
        return vacLongCurrent
      }
      vacLongCurrent.push({
        pid: processRedcapString(v.pid),
        year: year,
        status:
          processRedcapStringLower(v[`vac_${year}`])?.replace("yes - ", "") ??
          null,
      })
      return vacLongCurrent
    }, vacLong)
  )

  return decode(t.array(VaccinationV), vacLong)
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
        pid: processRedcapString(r.pid),
        day: day,
        date: processRedcapString(r[`scheduled_date_v${day}`]),
      })
      return scheduleLongCurrent
    }, scheduleLong)
  })

  return decode(t.array(ScheduleV), scheduleLong)
}

export const RedcapWeeklySurveyV = t.type({
  redcapRecordId: t.string,
  redcapProjectYear: t.number,
  index: t.number,
  date: t.union([DateFromISOString, t.null]),
  ari: t.boolean,
  swabCollection: t.union([t.boolean, t.null]),
})
export type RedcapWeeklySurvey = t.TypeOf<typeof RedcapWeeklySurveyV>

export async function exportWeeklySurvey(
  config: RedcapConfig
): Promise<RedcapWeeklySurvey[]> {
  const surv = (
    await redcapApiReq(config, {
      content: "record",
      fields: [
        "record_id",
        "ari_definition",
        "date_symptom_survey",
        "swab_collection",
      ].toString(),
      events: Array.from(Array(50).keys())
        .map((n) => `weekly_survey_${n}_arm_1`)
        .toString(),
      type: "flat",
      rawOrLabel: "raw",
      exportDataAccessGroups: "false",
    })
  )
    .map((r) => ({
      ari: processRedcapString(r.ari_definition),
      swabCollection: processRedcapString(r.swab_collection),
      ...r,
    }))
    .map((r: any) => ({
      redcapRecordId: r.record_id,
      redcapProjectYear: r.redcapProjectYear,
      index: parseInt(
        r.redcap_event_name.match(/weekly_survey_(\d+)_arm_1/)[1]
      ),
      date: processRedcapString(r.date_symptom_survey),
      ari: r.ari ? r.ari === "1" : null,
      swabCollection: r.swabCollection ? r.swabCollection === "1" : null,
    }))
    // Remove incomplete surveys
    .filter((r) => r.ari !== null)

  return decode(t.array(RedcapWeeklySurveyV), surv)
}
