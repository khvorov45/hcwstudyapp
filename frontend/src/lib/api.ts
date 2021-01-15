import axios from "axios"
import { StatusCodes } from "http-status-codes"
import * as t from "io-ts"
import { API_ROOT } from "./config"
import { User } from "./data"
import { decode } from "./io"

export type TableName =
  | "participants"
  | "schedule"
  | "weekly-survey"
  | "vaccination"
  | "withdrawn"
  | "users"

export type ApiPath =
  | TableName
  | "auth/token/verify"
  | "auth/token/send"
  | "auth/token"
  | "auth/token/user/session"
  | "participants/redcap/sync"
  | "users/redcap/sync"

type ApiRequestConfig<T, O, I> = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: ApiPath
  query?: Record<string, string>
  body?: User
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
    data: c.body,
  })
  if (res.status !== c.success) {
    throw Error(res.data)
  }
  if (res.status === StatusCodes.NO_CONTENT) {
    res.data = undefined
  }
  return decode(c.validator, res.data)
}
