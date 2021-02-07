export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export function stringSort(a: string, b: string) {
  return a > b ? 1 : a < b ? -1 : 0
}

export function numberSort(a: number, b: number) {
  return a - b
}
