import fetch from 'cross-fetch'

export function getConstQuery (email: string, token: string) {
  var constQuery = ''
  if (email && token) {
    constQuery = `?email=${email}&token=${token}`
  }
  return constQuery
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
  try {
    return await res.json()
  } catch (e) {
    return res.status
  }
}

export interface User {
  authorised: boolean,
  email: string,
  token: string,
  accessGroup: string
}

export function toTitleCase (str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
