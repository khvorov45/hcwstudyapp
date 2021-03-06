export function unique<T>(arr?: T[]): T[] {
  return Array.from(new Set(arr))
}

export function filterNotNull<T>(x: T | null): x is T {
  return x !== null
}

export function round(n: number | null, precision: number = 0): string | null {
  if (n === null) {
    return null
  }
  return n.toFixed(precision)
}

export function stringSort(a: string | null, b: string | null) {
  if (a === b) {
    return 0
  }
  if (a === "(missing)" || a === null) {
    return 1
  }
  if (b === "(missing)" || b === null) {
    return -1
  }
  return a > b ? 1 : a < b ? -1 : 0
}

export function booleanSort(a: string | null, b: string | null) {
  if (a === b) {
    return 0
  }
  if (a === "(missing)" || a === null) {
    return 1
  }
  if (b === "(missing)" || b === null) {
    return -1
  }
  if (a === "yes") {
    return -1
  }
  return 1
}

export function numberSort(a: number | null, b: number | null) {
  if (a === b) {
    return 0
  }
  if (a === null) {
    return -1
  }
  if (b === null) {
    return 1
  }
  return a - b
}

export function rangeSort(a: string | null, b: string | null) {
  if (a === b) {
    return 0
  }
  if (a === "(missing)" || a === null) {
    return 1
  }
  if (b === "(missing)" || b === null) {
    return -1
  }
  if (a?.startsWith(">") || b?.startsWith("<")) {
    return 1
  }
  if (b?.startsWith(">") || a?.startsWith("<")) {
    return -1
  }
  return stringSort(a, b)
}

function selectAsString<
  T extends Object,
  K extends { [k: string]: T[keyof T] }
>(a: T, keyGetter: (x: T) => K) {
  const keys = keyGetter(a)
  return Object.entries(keys)
    .map(([name, value]) => value)
    .join("-")
}

export function selectUnique<
  T extends Object,
  K extends { [k: string]: T[keyof T] }
>(arr: T[], keyGetter: (x: T) => K) {
  let selectedUnique: {
    object: K
    string: string
  }[] = []
  return arr.reduce((prev, cur) => {
    const curString = selectAsString(cur, keyGetter)
    if (!prev.map((p) => p.string).includes(curString)) {
      prev.push({ object: keyGetter(cur), string: curString })
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
    const subset = arr.filter(
      (a) => selectAsString(a, keyGetter) === uniqueValue.string
    )
    const summary = summarise(subset, uniqueValue.object)
    Object.assign(summary, uniqueValue.object)
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
    thresholds.length === 0 ? [0] : thresholds.sort(numberSort)
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
  const arrSorted = arr.sort(numberSort)
  // Just round to the nearest integer
  return arrSorted[Math.floor(q * (arr.length - 1) + 0.5)]
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
    prop,
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
    min: getMin(ns),
    max: getMax(ns),
  }
}

/** Assumes the array is appropriately sorted */
export function findBreaks(arr: (string | number)[]) {
  return arr.reduce((acc, x, i) => {
    if (i === 0) {
      acc.push({ value: x, index: i })
    } else if (x !== acc[acc.length - 1].value) {
      acc.push({ value: x, index: i })
    }
    return acc
  }, [] as { value: string | number; index: number }[])
}

export function insertInPlace<T>(arr: T[], index: number, entry: T) {
  arr.splice(index, 0, entry)
}

export function scaleLinear(
  x: number,
  from: [number, number],
  to: [number, number]
): number {
  if (from[0] === from[1]) {
    return (to[0] + to[1]) / 2
  }
  return (x - from[0]) * ((to[1] - to[0]) / (from[1] - from[0])) + to[0]
}

export function scaleLog(
  x: number,
  from: [number, number],
  to: [number, number]
): number {
  return scaleLinear(
    Math.log(x),
    [Math.log(from[0]), Math.log(from[1])],
    [to[0], to[1]]
  )
}

export function scaleOrdinal(
  x: string | number,
  possibleValues: (string | number)[],
  to: [number, number]
) {
  const i = possibleValues.findIndex((v) => v === x)
  return scaleLinear(i, [0, possibleValues.length - 1], to)
}

export function interpolateSinebow(t: number): string {
  return `rgb(
    ${255 * Math.sin((0.5 - t) * Math.PI) ** 2},
    ${255 * Math.sin((0.8333 - t) * Math.PI) ** 2},
    ${255 * Math.sin((1.1666 - t) * Math.PI) ** 2}
  )`
}

export function dateDiffYears(d1: Date | null, d2: Date | null): number | null {
  if (d1 === null || d2 === null) {
    return null
  }
  return (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

export function applyMultiFilter(
  opts: (string | number | null)[],
  value: string | number | null
) {
  return opts.length === 0 || opts.includes(value)
}

export function applySingleFilter(
  opt: string | number | null,
  value: string | number | null
) {
  return opt === null || value === opt
}

export function booleanToString(b: boolean | null | undefined): string {
  if (b === null || b === undefined) {
    return "(missing)"
  }
  return b ? "yes" : "no"
}
