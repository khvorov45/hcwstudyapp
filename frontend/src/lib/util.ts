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
