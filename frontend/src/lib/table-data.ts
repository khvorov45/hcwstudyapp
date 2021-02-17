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
} from "./data"
import { decode } from "./io"
import { dateDiffYears, getSum, rollup } from "./util"
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
  upto: t.number,
  count: t.number,
})
export type VaccinationCount = t.TypeOf<typeof VaccinationCountV>

function genVaccinationCounts(vaccination: Vaccination[]): VaccinationCount[] {
  const counts = [2020, 2021].flatMap((year) =>
    rollup(
      vaccination,
      (d) => ({ pid: d.pid }),
      (v) => ({
        upto: year,
        count: getSum(
          v
            .filter((v) => v.year < year)
            .map((v) =>
              ["australia", "overseas"].includes(v.status ?? "") ? 1 : 0
            )
        ),
      })
    )
  )
  return decode(t.array(VaccinationCountV), counts)
}

export const ParticipantExtraV = t.intersection([
  ParticipantV,
  t.type({
    ageRecruitment: t.union([t.number, t.null]),
    prevVac: t.number,
    bmi: t.union([t.number, t.null]),
  }),
])
export type ParticipantExtra = t.TypeOf<typeof ParticipantExtraV>

function genParticipantExtra(
  participants: Participant[],
  vaccinationCounts: VaccinationCount[]
): ParticipantExtra[] {
  const participantsExtra = participants.map((p) => ({
    ageRecruitment: dateDiffYears(p.dateScreening, p.dob),
    prevVac: vaccinationCounts.find((v) => v.pid === p.pid)?.count ?? 0,
    bmi:
      p.weightKG === null || p.heightCM === null
        ? null
        : p.weightKG / (p.heightCM / 100) ** 2,
    ...p,
  }))
  return decode(t.array(ParticipantExtraV), participantsExtra)
}

export const SerologyExtraV = t.intersection([
  SerologyV,
  t.type({
    site: SiteV,
    prevVac: t.number,
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
    return {
      ...s,
      site: p?.site,
      prevVac: p?.prevVac,
      virusShortName: v?.shortName,
      virusClade: v?.clade,
    }
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
  prevVac: t.number,
})
export type TitreChange = t.TypeOf<typeof TitreChangeV>

function genTitreChange(
  participantsExtra: ParticipantExtra[],
  serologyExtra: SerologyExtra[],
  virusTable: Virus[]
): TitreChange[] {
  const titreChanges = virusTable.flatMap((virus) =>
    STUDY_YEARS.flatMap((year) =>
      participantsExtra.map((participant) => {
        const subset = serologyExtra.filter(
          (s) =>
            s.pid === participant.pid &&
            s.virus === virus.name &&
            s.redcapProjectYear === year
        )
        const d2 = subset.find((s) => s.day === 14)?.titre ?? NaN
        const d1 = subset.find((s) => s.day === 0)?.titre ?? NaN
        const rise = d2 / d1
        return {
          virus: virus.name,
          virusShortName: virus.shortName,
          virusClade: virus.clade,
          pid: participant.pid,
          site: participant.site,
          prevVac: participant.prevVac,
          day1: 0,
          day2: 14,
          rise,
          seroconverted: d1 === 5 ? d2 >= 40 : rise >= 4,
          year,
        }
      })
    )
    .filter((p) => !isNaN(p.rise))
  )
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

  const vaccinationCounts = genVaccinationCounts(vaccination)
  const participantsExtra = genParticipantExtra(participants, vaccinationCounts)
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
  }
}
