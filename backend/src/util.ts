export function addDays(date: Date, days: number): Date {
  date.setDate(date.getDate() + days)
  return date
}

export function justDateString(date: Date | null): string | null {
  if (date === null) {
    return null
  }
  return date.toISOString().slice(0, 10)
}
