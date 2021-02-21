import * as t from "io-ts"
import { apiReq } from "./api"
import { StatusCodes } from "http-status-codes"
import { AsyncStateStatus } from "react-async-hook"
import {
  ParticipantV as ParticipantFullV,
  ScheduleV,
  WeeklySurveyV,
  VaccinationV,
  WithdrawnV,
  VirusV,
  SerologyV,
  Serology,
  Virus,
  SiteV,
  Vaccination,
  Schedule,
  WeeklySurvey,
  Withdrawn,
  ParticipantDeidentifiedV,
  MyDateV,
} from "./data"
import { decode } from "./io"
import { dateDiffYears, rollup } from "./util"
import { STUDY_YEARS } from "./config"

export const ParticipantV = t.union([
  ParticipantFullV,
  ParticipantDeidentifiedV,
])
export type Participant = t.TypeOf<typeof ParticipantV>

export const TableNameV = t.keyof({
  participants: null,
  schedule: null,
  "weekly-survey": null,
  vaccination: null,
  withdrawn: null,
  serology: null,

  virus: null,
})
export type TableName = t.TypeOf<typeof TableNameV>

export async function tableFetch<T>(
  name: TableName,
  validator: t.Type<T, unknown, any>,
  token: string
) {
  return await apiReq({
    method: "GET",
    path: name,
    token: token,
    success: StatusCodes.OK,
    failure: [StatusCodes.UNAUTHORIZED],
    validator: t.array(validator),
  })
}

export const VaccinationCountV = t.type({
  pid: t.string,
  site: SiteV,
  dateScreening: MyDateV,
  years: t.array(t.number),
})
export type VaccinationCount = t.TypeOf<typeof VaccinationCountV>

function genVaccinationCounts(
  vaccination: Vaccination[],
  participants: Participant[]
): VaccinationCount[] {
  const counts = rollup(
    vaccination,
    (d) => ({ pid: d.pid }),
    (v, k) => {
      const p = participants.find((p) => p.pid === k.pid)
      const vaxOnly = v.filter((x) =>
        ["australia", "overseas"].includes(x.status ?? "")
      )
      return {
        dateScreening: p?.dateScreening,
        site: p?.site,
        years: vaxOnly.map((x) => x.year),
      }
    }
  )
  return decode(t.array(VaccinationCountV), counts)
}

export const ParticipantExtraV = t.intersection([
  ParticipantV,
  t.type({
    ageRecruitment: t.union([t.number, t.null]),
    bmi: t.union([t.number, t.null]),
  }),
])
export type ParticipantExtra = t.TypeOf<typeof ParticipantExtraV>

function genParticipantExtra(participants: Participant[]): ParticipantExtra[] {
  const participantsExtra = participants.map((p) =>
    Object.assign(p, {
      ageRecruitment: dateDiffYears(p.dateScreening, p.dob),
      bmi:
        p.weightKG === null || p.heightCM === null
          ? null
          : p.weightKG / (p.heightCM / 100) ** 2,
    })
  )
  return decode(t.array(ParticipantExtraV), participantsExtra)
}

export const SerologyExtraV = t.intersection([
  SerologyV,
  t.type({
    site: SiteV,
    virusShortName: t.string,
    virusClade: t.string,
  }),
])
export type SerologyExtra = t.TypeOf<typeof SerologyExtraV>

function genSerologyExtra(
  serology: Serology[],
  virus: Virus[],
  participant: ParticipantExtra[]
): SerologyExtra[] {
  const serologyExtra = serology.map((s) => {
    const p = participant.find((p) => p.pid === s.pid)
    const v = virus.find((v) => v.name === s.virus)
    return Object.assign(s, {
      site: p?.site,
      virusShortName: v?.shortName,
      virusClade: v?.clade,
    })
  })
  return decode(t.array(SerologyExtraV), serologyExtra)
}

export const TitreChangeV = t.type({
  virus: t.string,
  virusShortName: t.string,
  virusClade: t.string,
  pid: t.string,
  site: SiteV,
  year: t.number,
  day1: t.number,
  day2: t.number,
  rise: t.number,
  seroconverted: t.boolean,
})
export type TitreChange = t.TypeOf<typeof TitreChangeV>

function genTitreChange(
  participantsExtra: ParticipantExtra[],
  serologyExtra: SerologyExtra[],
  virusTable: Virus[]
): TitreChange[] {
  const titreChanges: TitreChange[] = []
  for (const virus of virusTable) {
    let subset = serologyExtra.filter((s) => s.virus === virus.name)
    for (const year of STUDY_YEARS) {
      subset = subset.filter((s) => s.redcapProjectYear === year)
      for (const participant of participantsExtra) {
        subset = subset.filter((s) => s.pid === participant.pid)
        const d2 = subset.find((s) => s.day === 14)?.titre ?? NaN
        const d1 = subset.find((s) => s.day === 0)?.titre ?? NaN
        const rise = d2 / d1
        if (isNaN(rise)) {
          continue
        }
        titreChanges.push({
          virus: virus.name,
          virusShortName: virus.shortName,
          virusClade: virus.clade,
          pid: participant.pid,
          site: participant.site,
          day1: 0,
          day2: 14,
          rise,
          seroconverted: d1 === 5 ? d2 >= 40 : rise >= 4,
          year,
        })
      }
    }
  }
  return decode(t.array(TitreChangeV), titreChanges)
}

export type AllTableDataVanilla = {
  participants: Participant[]
  schedule: Schedule[]
  weeklySurvey: WeeklySurvey[]
  vaccination: Vaccination[]
  withdrawn: Withdrawn[]
  virus: Virus[]
  serology: Serology[]
}

export async function fetchAllTableData(
  authStatus: AsyncStateStatus,
  token?: string
): Promise<AllTableDataVanilla | null> {
  if (!token || authStatus !== "success") {
    return null
  }
  const [
    participants,
    schedule,
    weeklySurvey,
    vaccination,
    withdrawn,
    virus,
    serology,
  ] = await Promise.all([
    tableFetch("participants", ParticipantV, token),
    tableFetch("schedule", ScheduleV, token),
    tableFetch("weekly-survey", WeeklySurveyV, token),
    tableFetch("vaccination", VaccinationV, token),
    tableFetch("withdrawn", WithdrawnV, token),
    tableFetch("virus", VirusV, token),
    tableFetch("serology", SerologyV, token),
  ])
  return {
    participants,
    schedule,
    weeklySurvey,
    vaccination,
    withdrawn,
    virus,
    serology,
  }
}

export type AllTableData = {
  participantsExtra: ParticipantExtra[]
  schedule: Schedule[]
  weeklySurvey: WeeklySurvey[]
  vaccination: Vaccination[]
  withdrawn: Withdrawn[]
  virus: Virus[]
  serologyExtra: SerologyExtra[]
  titreChanges: TitreChange[]
  vaccinationCounts: VaccinationCount[]
}

export async function fetchAndProcessAll(
  authStatus: AsyncStateStatus,
  token?: string
): Promise<AllTableData | null> {
  if (!token || authStatus !== "success") {
    return null
  }

  const fetchRes = await fetchAllTableData(authStatus, token)

  if (!fetchRes) {
    return null
  }

  const {
    participants,
    schedule,
    weeklySurvey,
    vaccination,
    withdrawn,
    virus,
    serology,
  } = fetchRes

  const vaccinationCounts = genVaccinationCounts(vaccination, participants)
  const participantsExtra = genParticipantExtra(participants)
  const serologyExtra = genSerologyExtra(serology, virus, participantsExtra)
  const titreChanges = genTitreChange(participantsExtra, serologyExtra, virus)

  return {
    participantsExtra,
    schedule,
    weeklySurvey,
    vaccination,
    withdrawn,
    virus,
    serologyExtra,
    titreChanges,
    vaccinationCounts,
  }
}

export type TableSettings = {
  withdrawn: { setting: "yes" | "no" | "any"; ids: string[] }
}

function applyTableSettings<T extends { pid: string }>(
  settings: TableSettings,
  data: T[]
) {
  if (settings.withdrawn.setting !== "any") {
    return data?.filter(
      (r) =>
        settings.withdrawn.ids.includes(r.pid) ===
        (settings.withdrawn.setting === "yes")
    )
  }
  return data
}

export function applyTableSettingsAllData(
  settings: TableSettings,
  allData?: AllTableData | null
): AllTableData | null | undefined {
  if (!allData) {
    return allData
  }
  return {
    participantsExtra: applyTableSettings(settings, allData.participantsExtra),
    schedule: applyTableSettings(settings, allData.schedule),
    weeklySurvey: applyTableSettings(settings, allData.weeklySurvey),
    vaccination: applyTableSettings(settings, allData.vaccination),
    withdrawn: allData.withdrawn,
    virus: allData.virus,
    serologyExtra: applyTableSettings(settings, allData.serologyExtra),
    titreChanges: applyTableSettings(settings, allData.titreChanges),
    vaccinationCounts: applyTableSettings(settings, allData.vaccinationCounts),
  }
}
