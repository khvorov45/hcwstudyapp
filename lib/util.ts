import fetch from 'cross-fetch'

export function getConstQuery (email: string, token: string) {
  return email && token ? `?email=${email}&token=${token}` : '#'
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
  user: User, tableName: string, accessGroup: string
) {
  return await accessAPI(
    'getparticipants', 'GET',
    {
      email: user.email,
      token: user.token,
      subset: tableName,
      accessGroup: accessGroup
    }
  )
}
