import fetch from 'cross-fetch'
import { newconfig } from './config'

/** Makes a REDCap API request
 *
 * @param body Object with request parameters except token
 * (auto-attached from config) and format (json)
 */
export async function redcapApiReq (body) {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  myHeaders.append('Accept', 'application/json')
  body.token = newconfig.db.redcap.token
  body.format = 'json'
  const redcapres = await fetch(
    newconfig.db.redcap.url,
    {
      method: 'POST',
      headers: myHeaders,
      body: new URLSearchParams(body)
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
      email: user.email.toLowerCase(),
      accessGroup: user.data_access_group === '' ? 'unrestricted'
        : user.data_access_group.toLowerCase()
    })
  }
  return neededUsers
}

export async function exportParticipants () {
  const records = await exportRecords(
    [
      'record_id', 'redcap_data_access_group', 'pid', 'site_name',
      'date_screening', 'email', 'mobile_number', 'a1_gender', 'a2_dob'
    ],
    ['baseline_arm_1'], 'flat'
  )
  // Filter out all non-participants
  const recordsFiltered = records.filter(r => r.pid !== '')
  function processDate (date: string) {
    return date === '' ? null : new Date(date)
  }
  return recordsFiltered.map(r => {
    return {
      redcapRecordId: r.record_id,
      pid: r.pid,
      accessGroup: r.redcap_data_access_group.toLowerCase(),
      site: r.site_name,
      dateScreening: processDate(r.date_screening),
      email: r.email.toLowerCase(),
      mobile: r.mobile_number,
      gender: r.a1_gender,
      dob: processDate(r.a2_dob)
    }
  })
}
