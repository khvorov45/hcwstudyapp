import fetch from 'cross-fetch'
import config from './config'

/** Makes a REDCap API request
 *
 * @param body Object with request parameters except token
 * (auto-attached from config) and format (json)
 */
export async function redcapApiReq (body) {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  myHeaders.append('Accept', 'application/json')
  body.token = config.redcapCredentials.token
  body.format = 'json'
  const redcapres = await fetch(
    config.redcapCredentials.url,
    {
      method: 'POST',
      headers: myHeaders,
      body: new URLSearchParams(body).toString()
    }
  )
  return await redcapres.json()
}

/** Export records
 *
 * @param fields Variable names
 * @param events Event names
 * @param type 'flat' (maybe lots of NA) or 'eav'
 *  (can't export redcap_data_access_group)
 */
export async function exportRecords (
  fields: string[], events: string[], type: string
) {
  return await redcapApiReq({
    content: 'record',
    type: type,
    exportDataAccessGroups: 'true',
    rawOrLabel: 'label',
    fields: fields.toString(),
    events: events.toString()
  })
}

export async function exportUsers () {
  const allUsers = await redcapApiReq({ content: 'user' })
  const neededUsers = []
  for (const user of allUsers) {
    neededUsers.push({
      email: user.email,
      accessGroup: user.data_access_group === '' ? 'unrestricted'
        : user.data_access_group
    })
  }
  return neededUsers
}

export async function exportParticipants () {
  return await exportRecords(
    ['record_id', 'redcap_data_access_group', 'pid', 'site_name'],
    ['baseline_arm_1'], 'flat'
  )
}
