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

function uniqueRows<T extends { redcapProjectYear: number }>(
  a: T[],
  id: keyof T
): T[] {
  const allYears = Array.from(new Set(a.map((e) => e.redcapProjectYear)))
  return allYears.reduce((a, year) => {
    const aKeep = a.filter((e) => e.redcapProjectYear <= year)
    const aDrop = a.filter((e) => e.redcapProjectYear > year)
    const allCurrentYearIds = aKeep
      .filter((e) => e.redcapProjectYear === year)
      .map((e) => e[id])
    return aKeep.concat(aDrop.filter((e) => !allCurrentYearIds.includes(e[id])))
  }, a)
}

export async function exportUsers(config: RedcapConfig): Promise<User[]> {
  const users = (await redcapApiReq(config, { content: "user" })).map((u) => ({
    email: u.email.toLowerCase(),
    accessGroup:
      u.data_access_group === ""
        ? "unrestricted"
        : u.data_access_group.toLowerCase(),
    redcapProjectYear: u.redcapProjectYear,
  }))
  return decode(t.array(UserV), uniqueRows(users, "email"))
}

}
