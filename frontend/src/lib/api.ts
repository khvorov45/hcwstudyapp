import axios from "axios"
import * as t from "io-ts"
import { decode } from "./io"

type ApiRequestConfig<T, O, I> = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  url: string
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
    url: c.url,
    headers: c.token ? { Authorization: `Bearer ${c.token}` } : undefined,
    validateStatus: (s) => [c.success, ...c.failure].includes(s),
  })
  if (res.status !== c.success) {
    throw Error(res.data)
  }
  return decode(c.validator, res.data)
}
