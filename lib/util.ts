import fetch from 'cross-fetch'

export function getConstQuery (email: string, token: string) {
  return email && token ? `?email=${email}&token=${token}` : '#'
}

export function myFormatDate (d: Date): {datePart: string, timePart: string} {
  return {
    datePart: d.toISOString().split('T')[0],
    timePart: d.toTimeString().slice(0, 8)
  }
}

export function isDateISOString (datestring: string) {
  const reISO = new RegExp(
    /^(\d{4})-(\d{2})-(\d{2})/.source +
    /T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/.source
  )
  return reISO.exec(datestring)
}

export async function accessAPI (
  location: string, method: string, body?: any
) {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  myHeaders.append('Accept', 'application/json')
  if (method === 'GET') {
    location += '?' + new URLSearchParams(body).toString()
    body = null
  }
  const res = await fetch(
    `/api/${location}`,
    {
      method: method,
      headers: myHeaders,
      body: body ? new URLSearchParams(body) : null
    }
  )
  if (res.status !== 200) {
    console.error('API access failed with response status ' + res.status)
  }
  // Not interested in what the response is if it's not jsonable
  try {
    return await res.json()
  } catch (e) {
    return null
  }
}

export interface User {
  authorised: boolean,
  email: string,
  token: string,
  accessGroup: string
}

export function toTitleCase (str: string): string {
  if (!str) return null
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export async function fetchParticipantData (
  user: User, tableName: string, accessGroup: string, withdrawn?: boolean
) {
  const fetchedData = await accessAPI(
    'getparticipants', 'GET',
    {
      email: user.email,
      token: user.token,
      subset: tableName,
      accessGroup: accessGroup
    }
  )
  if (withdrawn === true) {
    return fetchedData.filter(r => r.withdrawn)
  } else if (withdrawn === false) {
    return fetchedData.filter(r => !r.withdrawn)
  } else {
    return fetchedData
  }
}

// Get day of week 0 Mon - 6 Sun
export function getDayOfWeek (d: Date) {
  return (d.getDay() + 6) % 7
}

// Returns the ISO week of the date.
export function getWeek (d: Date) {
  const date = new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  // Thursday in current week decides the year.
  // So set to Monday and then shift to Thursday
  date.setDate(date.getDate() - getDayOfWeek(date) + 3)
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4)
  // Work out the number of days between this week's Thursday and Jan 4's week
  // Thursday and divide by 7
  const millisecondsInDay = 86400000
  const daysFromJan4 = (date.getTime() - week1.getTime()) / millisecondsInDay
  return 1 + Math.round((daysFromJan4 - 3 + getDayOfWeek(week1)) / 7)
}

export function seq (from: number, to: number) {
  const result = []
  for (let i = from; i <= to; i++) {
    result.push(i)
  }
  return result
}
