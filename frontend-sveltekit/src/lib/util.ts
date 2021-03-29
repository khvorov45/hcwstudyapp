export type AsyncStatus = "success" | "error" | "loading" | "not-requested"

export enum Sort {
  No = 0,
  Down = 1,
  Up = 2,
}

export function nextSort(s: Sort): Sort {
  return (s + 1) % 3
}

export function sortToString(s: Sort): string {
  return s === Sort.Up ? "up" : s === Sort.Down ? "down" : "no"
}

export function stringSort<T>(
  accessor: (x: T) => string,
  rev: boolean = false
): (a: T, b: T) => number {
  return (x: T, y: T) => {
    let a = accessor(x)
    let b = accessor(y)
    let i = 0
    if (a > b) {
      i = 1
    } else if (a < b) {
      i = -1
    }
    let c = 1
    if (rev) {
      c = -1
    }
    return i * c
  }
}

export type NetworkError = {
  type: "network"
  message: string
}

export type DecodeError = {
  type: "decode"
  message: string
}

export type BackendError = {
  type: "backend"
  status: number
  message: string
}

export type ApiResponseError = NetworkError | DecodeError | BackendError

export function apiErrorToString(e: ApiResponseError): string {
  let s = `type: ${e.type}; `
  if (e.type === "backend") {
    s += `status: ${e.status}; `
  }
  s += `message: ${e.message}`
  return s
}

export type ApiRequest = {
  url: string
  token?: string | null
  method?: "GET" | "POST" | "PUT" | "DELETE"
  expectContent?: "none" | "json" | "text"
}

export type ApiReturn<T> = {
  data: T | null
  error: ApiResponseError | null
}

export type ApiResult<T> = {
  status: AsyncStatus
  result: ApiReturn<T> | null
}

export async function apiReq<T>({
  url,
  token = null,
  method = "GET",
  expectContent = "json",
}: ApiRequest): Promise<ApiReturn<T>> {
  let headers = {}
  if (token !== null) {
    headers = { Authorization: `Bearer ${token}` }
  }

  let res: any
  let data: T | null = null
  try {
    res = await fetch(`${process.env.API_ROOT}/${url}`, { method, headers })
  } catch (e) {
    return {
      data,
      error: { type: "network", message: e.message },
    }
  }

  const successCode = expectContent === "none" ? 204 : 200

  const status = res.status
  if (status !== successCode) {
    return {
      data,
      error: { status, type: "backend", message: await res.text() },
    }
  }

  switch (expectContent) {
    case "json": {
      try {
        data = await res.json()
      } catch (e) {
        return { data, error: { type: "decode", message: e.message } }
      }
      break
    }
    case "text": {
      data = await res.text()
      break
    }
    case "none": {
      break
    }
  }

  return { data, error: null }
}
