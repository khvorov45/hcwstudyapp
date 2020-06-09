import config from './config'

export async function getRedcapData () {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  myHeaders.append('Accept', 'application/json')
  const redcapres = await fetch(
    config.redcapCredentials.url,
    {
      method: 'POST',
      headers: myHeaders,
      body: new URLSearchParams({
        token: config.redcapCredentials.token,
        content: 'record',
        format: 'json',
        type: 'flat'
      }).toString()
    }
  )
  console.log(await redcapres.json())
}
