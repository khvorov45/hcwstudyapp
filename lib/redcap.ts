import config from './config'

export async function getRedcapData () {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  const redcapData = await fetch(
    config.redcapCredentials.url,
    {
      method: 'POST',
      headers: myHeaders,
      body: `token=${config.redcapCredentials.token}\
&content=record&format=json&type=flat`
    }
  )
  console.log(redcapData)
}
