import axios from "axios"

type ApiRequestConfig = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  url: string
  token?: string | null
  success: number
  failure: number[]
}

export async function apiReq(c: ApiRequestConfig) {
  const res = await axios.request({
    method: c.method,
    url: c.url,
    headers: c.token ? { Authorization: `Bearer ${c.token}` } : undefined,
    validateStatus: (s) => [c.success, ...c.failure].includes(s),
  })
  if (res.status !== c.success) {
    throw Error(res.data)
  }
  return res.data
}
