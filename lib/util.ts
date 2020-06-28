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
  if (!reISO.exec(datestring)) return datestring
  return new Date(datestring)
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
  return await res.json()
}
