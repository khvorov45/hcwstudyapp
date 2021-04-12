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
}
