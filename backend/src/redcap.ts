import axios from "axios"
import * as t from "io-ts"
import { User, UserV } from "./data"
import { decode } from "./io"

export type RedcapConfig = {
  url: string
  token: string
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
): Promise<any> {
  // Drop all empty fields
  const bodyNonEmpty: Record<string, string> = {
    token: config.token,
    format: "json",
  }
  Object.entries(body).map(([k, v]) => {
    if (v) {
      bodyNonEmpty[k] = v
    }
  })
  return (await axios.post(config.url, new URLSearchParams(bodyNonEmpty))).data
}

export async function exportUsers(config: RedcapConfig): Promise<User[]> {
  const users: any[] = await redcapApiReq(config, { content: "user" })
  const modUsers = users.map((u) => ({
    email: u.email.toLowerCase(),
    accessGroup:
      u.data_access_group === ""
        ? "unrestricted"
        : u.data_access_group.toLowerCase(),
    tokenhash: null,
  }))
  return decode(t.array(UserV), modUsers)
}
