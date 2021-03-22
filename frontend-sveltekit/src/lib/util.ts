export type AsyncStatus = "success" | "error" | "loading" | "not-requested"

export enum Sort {
  No = 0,
  Down = 1,
  Up = 2,
}

export function nextSort(s: Sort): Sort {
  return (s + 1) % 3
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
