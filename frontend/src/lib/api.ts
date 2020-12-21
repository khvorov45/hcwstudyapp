import axios from "axios"
import * as t from "io-ts"
import { API_ROOT } from "./config"
import { decode } from "./io"

type ApiRequestConfig<T, O, I> = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path:
    | "participants"
    | "users"
    | "auth/token/verify"
    | "schedule"
    | "weekly-survey"
    | "auth/token/send"
    | "auth/token"
    | "participants/redcap/sync"
  query?: Record<string, string>
  token?: string | null
  success: number
  failure: number[]
  validator: t.Type<T, O, I>
}

export async function apiReq<T, O, I>(
  c: ApiRequestConfig<T, O, I>
): Promise<T> {
  const res = await axios.request({
    method: c.method,
    url: `${API_ROOT}/${c.path}`,
    params: c.query,
    headers: c.token ? { Authorization: `Bearer ${c.token}` } : undefined,
    validateStatus: (s) => [c.success, ...c.failure].includes(s),
  })
  if (res.status !== c.success) {
    throw Error(res.data)
  }
  return decode(c.validator, res.data)
}
