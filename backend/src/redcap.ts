import axios from "axios"
import * as t from "io-ts"
import { User, UserV } from "./data"
import { decode } from "./io"

export type RedcapConfig = {
  url: string
  token2020: string
  token2021: string
}

type RedcapYears = "year2020" | "year2021"

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
): Promise<Record<RedcapYears, any>> {
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
  return { year2020: year2020.data, year2021: year2021.data }
}

export async function exportUsers(config: RedcapConfig): Promise<User[]> {
  const usersRes = await redcapApiReq(config, { content: "user" })
  // Pull emails out of users
  const emailsRes: Record<RedcapYears, string[]> = {
    year2020: usersRes.year2020.map((u: any) => u.email.toLowerCase()),
    year2021: usersRes.year2021.map((u: any) => u.email.toLowerCase()),
  }
  // Now concatenate with no email duplicates
  const users = usersRes.year2020
    // Attach only those 2021 users that are not present in 2020
    .concat(
      usersRes.year2021.filter(
        (u: any) => !emailsRes.year2020.includes(u.email.toLowerCase())
      )
    )
    .map((u: any) => ({
      email: u.email.toLowerCase(),
      accessGroup:
        u.data_access_group === ""
          ? "unrestricted"
          : u.data_access_group.toLowerCase(),
    }))
  return decode(t.array(UserV), users)
}
