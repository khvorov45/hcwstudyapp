export type Site =
  | "Sydney"
  | "Melbourne"
  | "Adelaide"
  | "Perth"
  | "Brisbane"
  | "Newcastle"

export type AccessGroup = "Admin" | "Unrestricted" | { Site: Site }

export function accessGroupToString(a: AccessGroup): string {
  return a === "Admin" || a === "Unrestricted" ? a : a.Site
}

export type User = {
  email: string
  access_group: AccessGroup
  kind: "Redcap" | "Manual"
  deidentified_export: boolean
}

export type Occupation =
  | "Nursing"
  | "Medical"
  | "Administrative"
  | "AlliedHealth"
  | "Laboratory"
  | "Ancillary"
  | "Research"
  | { Other: string }

export function isOccupationNotOther(a: Occupation): boolean {
  return (
    a === "Medical" ||
    a === "Administrative" ||
    a === "AlliedHealth" ||
    a === "Laboratory" ||
    a === "Ancillary" ||
    a === "Nursing" ||
    a === "Research"
  )
}

export function occupationToString(a: Occupation): string {
  // @ts-ignore
  return isOccupationNotOther(a) ? a : a.Other
}

export type Gender = "Male" | "Female" | "Other"

export type Participant = {
  pid: string
  site: Site
  email: string | null
  mobile: string | null
  date_screening: string | null
  date_birth: string | null
  age_recruitment: number | null
  height: number | null
  weight: number | null
  bmi: number | null
  gender: Gender | null
  occupation: Occupation | null
}

export type VaccinationHistory = {
  pid: string
  year: number
  status: "Australia" | "Overseas" | "No" | "Unknown" | null
}

export type Schedule = {
  pid: string
  year: number
  day: number
  date: string | null
}

export type SwabResult =
  | "InfluenzaAUnsubtyped"
  | "InfluenzaAh3"
  | "InfluenzaAh1"
  | "InfluenzaBNoLineage"
  | "InfluenzaBVic"
  | "InfluenzaBYam"
  | "InfluenzaC"
  | "Parainfluenza"
  | "HumanMetapneumovirus"
  | "Picornavirus"
  | "Adenovirus"
  | "CoronavirusSars"
  | "CoronavirusSarsCoV2"
  | "Negative"
  | { Other: string }

export function swabResultToString(s: SwabResult) {
  if (
    s === "InfluenzaAUnsubtyped" ||
    s === "InfluenzaAh3" ||
    s === "InfluenzaAh1" ||
    s === "InfluenzaBNoLineage" ||
    s === "InfluenzaBVic" ||
    s === "InfluenzaBYam" ||
    s === "InfluenzaC" ||
    s === "Parainfluenza" ||
    s === "HumanMetapneumovirus" ||
    s === "Picornavirus" ||
    s === "Adenovirus" ||
    s === "CoronavirusSars" ||
    s === "CoronavirusSarsCoV2" ||
    s === "Negative"
  ) {
    return s
  } else {
    return s.Other
  }
}

export type WeeklySurvey = {
  pid: string
  year: number
  index: number
  date: string | null
  ari: boolean | null
  swab_collection: boolean | null
  swab_result: SwabResult[]
}

export type Withdrawn = {
  pid: string
  date: string | null
  reason: string | null
}

export type Virus = {
  name: string
  short_name: string
  clade: string
}

export type Serology = {
  pid: string
  year: number
  day: number
  virus: string
  titre: number
}

export type ConsentDisease = "Flu" | "Covid"

export type ConsentForm = "Paper" | "Electronic"

export type StudyGroup = "MainOnly" | "MainAndNested"

export type Consent = {
  pid: string
  year: number
  disease: ConsentDisease
  form: ConsentForm
  group: StudyGroup | null
}

export type YearChange = {
  record_id: string
  year: number
  pid: string | null
  pid_preformat: string | null
}

export type KeyIssue<K, T> = {
  value: K
  rows: T[]
}

export type DataQuality = {
  schedule: {
    pk: KeyIssue<[string, number, number], Schedule>[]
  }
  weekly_survey: {
    pk: KeyIssue<[string, number, number], WeeklySurvey>[]
  }
  virus: {
    pk: KeyIssue<string, Virus>[]
  }
  serology: {
    pk: KeyIssue<string, Serology>[]
    fk_participant: KeyIssue<string, Serology>[]
    fk_virus: KeyIssue<string, Serology>[]
  }
  consent: {
    conflicting_groups: [String, number, ConsentDisease][]
  }
}
