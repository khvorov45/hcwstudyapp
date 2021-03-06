import * as t from "io-ts"
import { DateFromISOString, date } from "io-ts-types"

export const MyDateV = t.union([DateFromISOString, date])
export type MyDate = t.TypeOf<typeof MyDateV>

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

export const VaccinationStatusV = t.keyof({
  australia: null,
  overseas: null,
  no: null,
  unknown: null,
})
export type VaccinationStatus = t.TypeOf<typeof VaccinationStatusV>

export const CovidVaccineBrandV = t.keyof({
  pfizer: null,
  astra: null,
  other: null,
})
export type CovidVaccineBrand = t.TypeOf<typeof CovidVaccineBrandV>

export const OccupationV = t.keyof({
  nursing: null,
  medical: null,
  administrative: null,
  alliedHealth: null,
  laboratory: null,
  ancillary: null,
  other: null,
  research: null,
})
export type Occupation = t.TypeOf<typeof OccupationV>

export const SwabResultV = t.keyof({
  "Influenza A (unsubtyped)": null,
  "Influenza A H3": null,
  "Influenza A H1": null,
  "Influenza B (no lineage)": null,
  "Influenza B Vic": null,
  "Influenza B Yam": null,
  "Influenza C": null,
  Parainfluenza: null,
  "Human metapneumovirus": null,
  Picornavirus: null,
  Adenovirus: null,
  "Coronavirus OC43, 229E, NL63, HKU, SARS": null,
  "Coronavirus SARS-CoV-2": null,
  Other: null,
  Negative: null,
})
export type SwabResult = t.TypeOf<typeof SwabResultV>

export const TokenTypeV = t.keyof({
  session: null,
  api: null,
})
export type TokenType = t.TypeOf<typeof TokenTypeV>

export const UserKindV = t.keyof({
  redcap: null,
  manual: null,
})
export type UserKind = t.TypeOf<typeof UserKindV>

export const UserV = t.type({
  email: t.string,
  accessGroup: AccessGroupV,
  kind: UserKindV,
  deidentifiedExport: t.boolean,
})
export type User = t.TypeOf<typeof UserV>

export const UserToInsertV = t.type({
  email: t.string,
  accessGroup: AccessGroupV,
  deidentifiedExport: t.boolean,
})
export type UserToInsert = t.TypeOf<typeof UserToInsertV>

export const TokenV = t.type({
  user: t.string,
  token: t.string,
  type: TokenTypeV,
  expires: t.union([MyDateV, t.null]),
})
export type Token = t.TypeOf<typeof TokenV>

export const ParticipantDeidentifiedV = t.type({
  pid: t.string,
  site: SiteV,
  dateScreening: t.union([MyDateV, t.null]),
  dob: t.union([MyDateV, t.null]),
  gender: t.union([GenderV, t.null]),
  baselineQuestComplete: t.boolean,
  heightCM: t.union([t.number, t.null]),
  weightKG: t.union([t.number, t.null]),
  atsi: t.union([t.boolean, t.null]),
  occupation: t.union([OccupationV, t.null]),
})
export type ParticipantDeidentified = t.TypeOf<typeof ParticipantDeidentifiedV>

export const ParticipantV = t.intersection([
  ParticipantDeidentifiedV,
  t.type({
    email: t.union([t.string, t.null]),
    mobile: t.union([t.string, t.null]),
  }),
])
export type Participant = t.TypeOf<typeof ParticipantV>

export const YearChangeV = t.type({
  redcapRecordId: t.string,
  redcapProjectYear: t.number,
  pid: t.string,
  pidPreformat: t.string,
  nested: t.union([t.boolean, t.null]),
})
export type YearChange = t.TypeOf<typeof YearChangeV>

export const WithdrawnV = t.type({
  pid: t.string,
  date: t.union([MyDateV, t.null]),
})
export type Withdrawn = t.TypeOf<typeof WithdrawnV>

export const VaccinationV = t.type({
  pid: t.string,
  year: t.number,
  status: t.union([VaccinationStatusV, t.null]),
})
export type Vaccination = t.TypeOf<typeof VaccinationV>

export const VaccinationCovidV = t.type({
  pid: t.string,
  year: t.number,
  dose: t.number,
  date: t.union([MyDateV, t.null]),
  brand: t.union([CovidVaccineBrandV, t.null]),
  brandOther: t.union([t.string, t.null]),
  batch: t.union([t.string, t.null]),
  surveyIndex: t.union([t.number, t.null]),
})
export type VaccinationCovid = t.TypeOf<typeof VaccinationCovidV>

export const ScheduleV = t.type({
  pid: t.string,
  day: t.number,
  redcapProjectYear: t.number,
  date: t.union([MyDateV, t.null]),
})
export type Schedule = t.TypeOf<typeof ScheduleV>

export const WeeklySurveyV = t.type({
  pid: t.string,
  index: t.number,
  redcapProjectYear: t.number,
  date: t.union([MyDateV, t.null]),
  ari: t.boolean,
  swabCollection: t.union([t.boolean, t.null]),
  swabResult: t.array(SwabResultV),
})
export type WeeklySurvey = t.TypeOf<typeof WeeklySurveyV>

export const VirusV = t.type({
  name: t.string,
  shortName: t.string,
  clade: t.string,
})
export type Virus = t.TypeOf<typeof VirusV>

export const SerologyV = t.type({
  pid: t.string,
  redcapProjectYear: t.number,
  day: t.number,
  virus: t.string,
  titre: t.number,
})
export type Serology = t.TypeOf<typeof SerologyV>

export const RegistrationOfInterestV = t.type({
  site: SiteV,
  name: t.union([t.string, t.null]),
  email: t.union([t.string, t.null]),
  mobile: t.union([t.string, t.null]),
  date: MyDateV,
})
export type RegistrationOfInterest = t.TypeOf<typeof RegistrationOfInterestV>

export const TimepointV = t.keyof({
  prevax: null,
  postvax7d: null,
  postvax14d: null,
  postseason: null,
})
export type Timepoint = t.TypeOf<typeof TimepointV>

export const BloodSampleV = t.type({
  pid: t.string,
  year: t.number,
  timepoint: TimepointV,
  date: MyDateV,
})
export type BloodSample = t.TypeOf<typeof BloodSampleV>
