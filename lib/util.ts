import fetch from 'cross-fetch'

export function getConstQuery (email: string, token: string) {
  var constQuery = ''
  if (email && token) {
    constQuery = `?email=${email}&token=${token}`
  }
  return constQuery
}

export async function fetchOwnApi (
  email: string, token: string, which: string
) {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  myHeaders.append('Accept', 'application/json')
  const res = await fetch(
    `/api/${which}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: new URLSearchParams({ email: email, token: token })
    }
  )
  return await res.json()
}

export async function accessAPI (
  location: string, method: string, body?: any
) {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  myHeaders.append('Accept', 'application/json')
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
