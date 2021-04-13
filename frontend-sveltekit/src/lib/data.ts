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
  year: Site
  status: "Australia" | "Overseas" | "No" | "Unknown" | null
}
