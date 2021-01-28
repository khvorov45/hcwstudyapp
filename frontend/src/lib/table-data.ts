import * as t from "io-ts"
import { apiReq, TableName } from "./api"
import { StatusCodes } from "http-status-codes"
import { AsyncStateStatus } from "react-async-hook"
import {
  ParticipantV,
  ScheduleV,
  WeeklySurveyV,
  VaccinationV,
  WithdrawnV,
  VirusV,
  SerologyV,
  Serology,
  Virus,
  SiteV,
  Participant,
  Vaccination,
} from "./data"
import { decode } from "./io"
import moment from "moment"
import * as d3 from "d3-array"

export type TableSettings = {
  withdrawn: { setting: "yes" | "no" | "any"; ids: string[] }
}

function applyTableSettings<T extends { pid: string }>(
  settings: TableSettings,
  data?: T[]
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
  count: t.number,
})
export type VaccinationCount = t.TypeOf<typeof VaccinationCountV>

function genVaccinationCounts(vaccination: Vaccination[]): VaccinationCount[] {
  const counts = d3.rollup(
    vaccination,
    (v) =>
      d3.sum(v, (v) =>
        ["australia", "overseas"].includes(v.status ?? "") ? 1 : 0
      ),
    (d) => d.pid
  )
  const countsArray = Array.from(counts, ([k, v]) => ({
    pid: k,
    count: v,
  })).sort((a, b) => (a.count > b.count ? 1 : a.count < b.count ? -1 : 0))
  return decode(t.array(VaccinationCountV), countsArray)
}

export const ParticipantExtraV = t.intersection([
  ParticipantV,
  t.type({
    age: t.number,
    prevVac: t.number,
  }),
])
export type ParticipantExtra = t.TypeOf<typeof ParticipantExtraV>

function genParticipantExtra(
  participants: Participant[],
  vaccinationCounts: VaccinationCount[]
): ParticipantExtra[] {
  const now = moment()
  const participantsExtra = participants.map((p) => ({
    age: now.diff(p.dob, "year"),
    prevVac: vaccinationCounts.find((v) => v.pid === p.pid)?.count ?? 0,
    ...p,
  }))
  return participantsExtra
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
  pid: t.string,
  site: SiteV,
  day1: t.number,
  day2: t.number,
  rise: t.number,
})
export type TitreChange = t.TypeOf<typeof TitreChangeV>

function genTitreChange(
  viruses: string[],
  participantsExtra: ParticipantExtra[],
  serologyExtra: SerologyExtra[]
): TitreChange[] {
  const titreChanges = viruses.flatMap((virus) =>
    participantsExtra.map((participant) => ({
      virus,
      pid: participant.pid,
      site: participant.site,
      day1: 0,
      day2: 14,
      rise: Math.exp(
        Math.log(
          serologyExtra.find(
            (s) =>
              s.pid === participant.pid && s.virus === virus && s.day === 14
          )?.titre ?? NaN
        ) -
          Math.log(
            serologyExtra.find(
              (s) =>
                s.pid === participant.pid && s.virus === virus && s.day === 0
            )?.titre ?? NaN
          )
      ),
    }))
  )
  return decode(t.array(TitreChangeV), titreChanges)
}

export async function loadAllTableData(
  authStatus: AsyncStateStatus,
  token?: string
) {
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

  const vaccinationCounts = genVaccinationCounts(vaccination)
  const participantsExtra = genParticipantExtra(participants, vaccinationCounts)
  const serologyExtra = genSerologyExtra(serology, virus, participantsExtra)
  const titreChanges = genTitreChange(
    virus.map((v) => v.name),
    participantsExtra,
    serologyExtra
  )

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
