import axios from "axios"
import * as t from "io-ts"
import { User, UserV, Participant, ParticipantV } from "./data"
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
    })
  )
    .map((r: any) => ({
      pid: processRedcapString(r.pid),
      accessGroup: processRedcapDataAccessGroup(r.redcap_data_access_group),
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

  return decode(t.array(ParticipantV), uniqueRows(records, "pid"))
}
