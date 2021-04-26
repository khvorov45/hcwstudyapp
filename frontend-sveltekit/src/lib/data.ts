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

export function occupationToString(a: Occupation): string {
  return a === "Medical" ||
    a === "Administrative" ||
    a === "AlliedHealth" ||
    a === "Laboratory" ||
    a === "Ancillary" ||
    a === "Nursing" ||
    a === "Research"
    ? a
    : a.Other
}

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
  gender: "Male" | "Female" | "Other" | null
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
