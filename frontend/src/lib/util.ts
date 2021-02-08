export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
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
>(arr: T[], keyGetter: (x: T) => K, summarise: (arr: T[]) => S) {
  const uniqueValues = selectUnique(arr, keyGetter)
  return uniqueValues.map((uniqueValue) => {
    const subset = arr.filter(
      (a) => selectAsString(a, keyGetter) === uniqueValue.string
    )
    const summary = summarise(subset)
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
): string {
  if (isNaN(x) || x === null || x === undefined) {
    return missing
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
    return formatLow(thresholdsSorted[0])
  }
  if (compareLeft(x, thresholdsSorted[thresholdsSorted.length - 1])) {
    return formatHigh(thresholdsSorted[thresholdsSorted.length - 1])
  }
  const closestHighIndex = thresholdsSorted.findIndex(
    (t, i) => compareLeft(x, thresholdsSorted[i - 1]) && compareRight(x, t)
  )
  return formatBetween(
    thresholdsSorted[closestHighIndex - 1],
    thresholdsSorted[closestHighIndex]
  )
}
