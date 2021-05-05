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

export enum FetchTableStatus {
  AlreadyFetched,
  Reset,
  Fetched,
}

export async function fetchTable(
  // TODO: Better type for store
  store: any,
  token: string | null,
  loginStatus: AsyncStatus,
  mounted: boolean
): Promise<FetchTableStatus> {
  let content: any
  let unsubscribe = store.subscribe((c: any) => (content = c))
  unsubscribe()

  if (
    content.status === "success" ||
    content.status === "loading" ||
    !mounted
  ) {
    return FetchTableStatus.AlreadyFetched
  }
  if (token === null || loginStatus !== "success") {
    store.update((c) => {
      c.status = "not-requested"
      c.result = null
      return c
    })
    return FetchTableStatus.Reset
  }

  await store.execute({ token })

  unsubscribe = store.subscribe((c: any) => (content = c))
  unsubscribe()

  if (content.result?.error !== null) {
    console.error(content.result.error)
  }

  return FetchTableStatus.Fetched
}

export type SubnavLink = {
  link: string
  title: string
  width: number
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

export const tableFilterIncludes: TableDisplayFilter = {
  values: 1,
  fun: (v, c) => v.includes(c),
}

export function seq(from: number, to: number): number[] {
  let arr: number[] = []
  for (let i = from; i < to; i++) {
    arr.push(i)
  }
  return arr
}

export function rep(what: number, times: number): number[] {
  let arr: number[] = []
  for (let i = 0; i < times; i++) {
    arr.push(what)
  }
  return arr
}

function compareObjects<T extends Object>(o1: T, o2: T) {
  let equal = true
  for (let key of Object.keys(o2)) {
    if (o1[key] !== o2[key]) {
      equal = false
      break
    }
  }
  return equal
}

export function selectUnique<
  T extends Object,
  K extends { [k: string]: T[keyof T] }
>(arr: T[], keyGetter: (x: T) => K) {
  let selectedUnique: K[] = []
  return arr.reduce((prev, cur) => {
    const curObject = keyGetter(cur)
    if (prev.findIndex((p) => compareObjects(p, curObject)) === -1) {
      prev.push(curObject)
    }
    return prev
  }, selectedUnique)
}

export function rollup<
  T extends Object,
  K extends { [k: string]: T[keyof T] },
  S extends Object
>(arr: T[], keyGetter: (x: T) => K, summarise: (arr: T[], k: K) => S) {
  const uniqueValues = selectUnique(arr, keyGetter)
  return uniqueValues.map((uniqueValue) => {
    const subset = arr.filter((a) => compareObjects(uniqueValue, keyGetter(a)))
    const summary = summarise(subset, uniqueValue)
    Object.assign(summary, uniqueValue)
    return summary as S & K
  })
}

export function cut(
  x: number | null,
  {
    thresholds = [],
    mode = "left",
    formatLow = (x) => `<${mode === "left" ? "" : "="}${x}`,
    formatHigh = (x) => `>${mode === "left" ? "=" : ""}${x}`,
    formatBetween = (x1, x2) => `${x1}-${x2}`,
    missing = "(missing)",
  }: {
    thresholds?: number[]
    mode?: "left" | "right"
    formatLow?: (x: number) => string
    formatHigh?: (x: number) => string
    formatBetween?: (x1: number, x2: number) => string
    missing?: string
  }
): { string: string; low: number; high: number } {
  if (x === undefined || x === null || isNaN(x)) {
    return { string: missing, low: Infinity, high: Infinity }
  }
  const compareLeft =
    mode === "left"
      ? (x: number, left: number) => x >= left
      : (x: number, left: number) => x > left
  const compareRight =
    mode === "left"
      ? (x: number, right: number) => x < right
      : (x: number, right: number) => x <= right
  const thresholdsSorted =
    thresholds.length === 0 ? [0] : thresholds.sort((a, b) => a - b)
  if (compareRight(x, thresholdsSorted[0])) {
    return {
      string: formatLow(thresholdsSorted[0]),
      low: -Infinity,
      high: thresholdsSorted[0],
    }
  }
  if (compareLeft(x, thresholdsSorted[thresholdsSorted.length - 1])) {
    return {
      string: formatHigh(thresholdsSorted[thresholdsSorted.length - 1]),
      low: thresholdsSorted[thresholdsSorted.length - 1],
      high: Infinity,
    }
  }
  const closestHighIndex = thresholdsSorted.findIndex(
    (t, i) => compareLeft(x, thresholdsSorted[i - 1]) && compareRight(x, t)
  )
  return {
    string: formatBetween(
      thresholdsSorted[closestHighIndex - 1],
      thresholdsSorted[closestHighIndex]
    ),
    low: thresholdsSorted[closestHighIndex - 1],
    high: thresholdsSorted[closestHighIndex],
  }
}

export function getSum(arr: number[]): number {
  return arr.reduce((sum, x) => sum + x, 0)
}

export function getCumsum(arr: number[]): number[] {
  return arr.reduce((acc, x) => {
    const last = acc[acc.length - 1] ?? 0
    acc.push(last + x)
    return acc
  }, [] as number[])
}

export function getMean(arr: number[]): number {
  return getSum(arr) / arr.length
}

export function getVariance(arr: number[]): number {
  const mean = getMean(arr)
  return getSum(arr.map((x) => x - mean).map((x) => x * x)) / (arr.length - 1)
}

export function getStandardDeviation(arr: number[]): number {
  return Math.sqrt(getVariance(arr))
}

export function getMeanVariance(arr: number[]) {
  return getVariance(arr) / arr.length
}

export function getMeanStandardError(arr: number[]) {
  return Math.sqrt(getMeanVariance(arr))
}

export function getQuantile(arr: (number | null)[], q: number) {
  const arrSorted = arr.sort((a, b) => a - b)
  // Just round to the nearest integer
  return arrSorted[Math.round(q * (arr.length - 1))]
}

export function getMin(arr: (number | null)[]): number {
  // TS can't tell I'm removing all nulls from the array
  // @ts-ignore
  return (
    arr
      .filter((x) => x !== null)
      // @ts-ignore
      .reduce((acc, x) => (x < acc ? x : acc), Infinity)
  )
}

export function getMax(arr: (number | null)[]): number {
  // TS can't tell I'm removing all nulls from the array
  // @ts-ignore
  return (
    arr
      .filter((x) => x !== null)
      // @ts-ignore
      .reduce((acc, x) => (x > acc ? x : acc), -Infinity)
  )
}

/** Array passed is not `log`ed */
export function summariseLogmean(arr: number[], precision: number = 3) {
  const logs = arr.map(Math.log)
  const logmean = getMean(logs)
  const se = getMeanStandardError(logs)
  const mean = Math.exp(logmean)
  const logerr = 1.96 * se
  const loglow = logmean - logerr
  const loghigh = logmean + logerr
  const low = Math.exp(loglow)
  const high = Math.exp(loghigh)
  return { kind: "logmean", mean, low, high, precision }
}

export function summariseProportion(v: boolean[]) {
  const prop = v.filter((x) => x).length / v.length
  // Normal approximation
  const se = Math.sqrt((prop * (1 - prop)) / v.length)
  const err = 1.96 * se
  return {
    kind: "proportion",
    mean: prop,
    low: Math.max(prop - err, 0),
    high: Math.min(prop + err, 1),
  }
}

export function summariseCount<T>(ns: T[]) {
  return {
    kind: "count",
    n: ns.length,
  }
}

export function summariseNumeric(ns: (number | null)[]) {
  return {
    kind: "numeric",
    mean: getQuantile(ns, 0.5),
    low: getMin(ns),
    high: getMax(ns),
  }
}
