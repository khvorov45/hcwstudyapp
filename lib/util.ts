import fetch from 'cross-fetch'

export function getConstQuery (id: number, token: string) {
  var constQuery = ''
  if (id && token) {
    constQuery = `?id=${id}&token=${token}`
  }
  return constQuery
}

export async function fetchOwnApi (id: number, token: string, which: string) {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  myHeaders.append('Accept', 'application/json')
  const res = await fetch(
    `/api/${which}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: new URLSearchParams({ id: id.toString(), token: token })
    }
  )
  return await res.json()
}
