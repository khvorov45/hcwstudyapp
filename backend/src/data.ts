import * as t from "io-ts"
import { DateFromISOString } from "io-ts-types"

// https://github.com/gcanti/io-ts/blob/master/index.md#union-of-string-literals
export const SiteV = t.keyof({
  melbourne: null,
  sydney: null,
  adelaide: null,
  brisbane: null,
  newcastle: null,
  perth: null,
})
export type Site = t.TypeOf<typeof SiteV>

export const AccessGroupV = t.keyof({
  admin: null,
  unrestricted: null,
  ...SiteV.keys,
})
export type AccessGroup = t.TypeOf<typeof AccessGroupV>

export function isSite(a: AccessGroup) {
  return Object.keys(SiteV.keys).includes(a)
}

export const GenderV = t.keyof({
  female: null,
  male: null,
  other: null,
})
export type Gender = t.TypeOf<typeof GenderV>

export const UserV = t.type({
  email: t.string,
  accessGroup: AccessGroupV,
  tokenhash: t.union([t.string, t.null, t.undefined]),
})
export type User = t.TypeOf<typeof UserV>

export const ParticipantV = t.type({
  pid: t.string,
  site: SiteV,
  dateScreening: t.union([DateFromISOString, t.null]),
  email: t.union([t.string, t.null]),
  mobile: t.union([t.string, t.null]),
  addBleed: t.union([t.boolean, t.null]),
  dob: t.union([DateFromISOString, t.null]),
  gender: t.union([GenderV, t.null]),
  baselineQuestComplete: t.boolean,
})
export type Participant = t.TypeOf<typeof ParticipantV>

export const VaccinationHistoryV = t.type({
  redcapRecordId: t.string,
  year: t.number,
  status: t.union([t.boolean, t.null]),
})
export type VaccinationHistory = t.TypeOf<typeof VaccinationHistoryV>
