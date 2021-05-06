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

/* For a given date, get the ISO week number

  Based on information at:

  http://www.merlyn.demon.co.uk/weekcalc.htm#WNR

  Algorithm is to find nearest thursday, it's year
  is the year of the week number. Then get weeks
  between that date and the first day of that year.

  Note that dates in one year can be weeks of previous
  or next year, overlap is up to 3 days.

  2014/12/29 is Monday in week 1 of 2015
  2012/01/01 is Sunday in week 52 of 2011
 */
export function getWeek(d: Date) {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  // Get first day of year
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  var weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
  // Return array of year and week number
  return [d.getUTCFullYear(), weekNo]
}

export function getWeekBounds({
  week,
  year,
}: {
  week: number
  year: number
}): [Date, Date] {
  //* Set to year start
  const d = new Date(Date.UTC(year, 0, 1))
  //* Set yearStart to the nearest Thursday
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  //* Set to target Thursday
  d.setDate(d.getDate() + week * 7)
  //* Set to target Monday
  d.setDate(d.getDate() - 3)
  const targetSunday = new Date(d)
  targetSunday.setDate(targetSunday.getDate() + 6)
  return [d, targetSunday]
}

export function seq(min: number, max: number): number[] {
  let arr: number[] = []
  for (let i = min; i < max; i++) {
    arr.push(i)
  }
  return arr
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
