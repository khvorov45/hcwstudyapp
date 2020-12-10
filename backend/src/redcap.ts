import axios from "axios"
import * as t from "io-ts"
import { AccessGroup, User, UserV } from "./data"
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
  lables?: "true" | "false"
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

function unique<T>(a: T[]): T[] {
  return Array.from(new Set(a))
}

export async function exportUsers(config: RedcapConfig): Promise<User[]> {
  const usersRaw: {
    email: string
    accessGroup: AccessGroup
    year: number
  }[] = (await redcapApiReq(config, { content: "user" })).map((u: any) => ({
    email: u.email.toLowerCase(),
    accessGroup:
      u.data_access_group === ""
        ? "unrestricted"
        : u.data_access_group.toLowerCase(),
    year: u.redcapProjectYear,
  }))
  const allYears = unique(usersRaw.map((u) => u.year))
  const usersUnique = allYears.reduce((users, year) => {
    const usersKeep = users.filter((u) => u.year <= year)
    const usersDrop = users.filter((u) => u.year > year)
    const allCurrentYearEmails = usersKeep
      .filter((u) => u.year === year)
      .map((u) => u.email)
    return usersKeep.concat(
      usersDrop.filter((u) => !allCurrentYearEmails.includes(u.email))
    )
  }, usersRaw)
  return decode(t.array(UserV), usersUnique)
}
