export type AsyncStatus = "success" | "error" | "loading" | "not-requested"

export enum Sort {
  No = 0,
  Up = 1,
  Down = 2,
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

export function detectScrollbarWidth(): number {
  // thanks to https://davidwalsh.name/detect-scrollbar-width
  const scrollDiv = document.createElement("div")
  scrollDiv.setAttribute(
    "style",
    `width: 100px; height: 100px;
    overflow: scroll; position:absolute; top:-9999px;`
  )
  document.body.appendChild(scrollDiv)
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
  document.body.removeChild(scrollDiv)
  return scrollbarWidth
}

export type TableDisplayFilter = {
  values: 1 | 2
  fun: (...args: any) => boolean
}

export type TableDisplayHeader<T> = {
  title: string
  accessor: (row: T) => string
  width: number
  filter: TableDisplayFilter
}

export type TableDisplayData<T> = {
  headers: TableDisplayHeader<T>[]
  rows: T[]
}

export async function fetchTable(
  // TODO: Better type for store
  store: any,
  token: string | null,
  loginStatus: AsyncStatus,
  mounted: boolean
) {
  let content: any
  let unsubscribe = store.subscribe((c: any) => (content = c))
  unsubscribe()

  if (
    content.status === "success" ||
    content.status === "loading" ||
    !mounted
  ) {
    return
  }
  if (token === null || loginStatus !== "success") {
    store.update((c) => {
      c.status = "not-requested"
      c.result = null
      return c
    })
    return
  }

  await store.execute({ token })

  unsubscribe = store.subscribe((c: any) => (content = c))
  unsubscribe()

  if (content.result?.error !== null) {
    console.error(content.result.error)
  }
}

export type SubnavLink = {
  link: string
  title: string
  width: string
}

export function justDateString(d: Date) {
  return d.toISOString().slice(10)
}

export const tableFilterBetween: TableDisplayFilter = {
  values: 2,
  fun: (v, c) =>
    c[0] === "" ? v <= c[1] : c[1] === "" ? v >= c[0] : v <= c[1] && v >= c[0],
}

export const tableFilterStartsWith: TableDisplayFilter = {
  values: 1,
  fun: (v, c) => v.startsWith(c),
}

export function seq(from: number, to: number): number[] {
  let arr: number[] = []
  for (let i = from; i <= to; i++) {
    arr.push(i)
  }
  return arr
}
