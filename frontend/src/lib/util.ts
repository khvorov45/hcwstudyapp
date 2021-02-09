export function unique<T>(arr?: T[]): T[] {
  return Array.from(new Set(arr))
}

export function round(n: number, precision: number): string {
  return n.toFixed(precision)
}

export function stringSort(a: string, b: string) {
  if (a === "(missing)") {
    return 1
  }
  if (b === "(missing)") {
    return -1
  }
  return a > b ? 1 : a < b ? -1 : 0
}

export function numberSort(a: number, b: number) {
  return a - b
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
  x: number,
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
  if (isNaN(x) || x === null || x === undefined) {
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

export function getQuantile(arr: number[], q: number) {
  const arrSorted = arr.sort(numberSort)
  return arrSorted[Math.floor(q * (arr.length - 1))]
}

export function getMin(arr: number[]): number {
  return arr.reduce((acc, x) => (x < acc ? x : acc), Infinity)
}

export function getMax(arr: number[]): number {
  return arr.reduce((acc, x) => (x > acc ? x : acc), -Infinity)
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

export function summariseNumeric(ns: number[]) {
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
