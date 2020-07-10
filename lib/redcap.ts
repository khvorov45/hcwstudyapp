import fetch from 'cross-fetch'
import { newconfig } from './config'

function processDate (date: string) {
  return date === '' ? null : new Date(date)
}

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
 * @param labels Export labels if `true`, values otherwise
 */
export async function exportRecords (
  fields: string[], events: string[], type: string, labels: boolean
) {
  return await redcapApiReq({
    content: 'record',
    type: type,
    exportDataAccessGroups: 'true',
    rawOrLabel: labels ? 'label' : 'raw',
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
      'date_screening', 'email', 'mobile_number', 'a1_gender', 'a2_dob',
      'add_bleed', 'study_group_vacc', 'baseline_questionnaire_complete'
    ],
    ['baseline_arm_1'], 'flat', true
  )
  const withdrawn = await exportRecords(
    ['record_id', 'withdrawn'], ['withdrawal_arm_1'], 'flat', false
  )
  const withdrawnIDs = withdrawn
    .filter(r => r.withdrawn === '1')
    .map(r => r.record_id)
  // Filter out all non-participants
  const recordsFiltered = records.filter(r => r.pid !== '')
  return recordsFiltered.map(r => {
    return {
      redcapRecordId: r.record_id,
      pid: r.pid,
      accessGroup: r.redcap_data_access_group.toLowerCase(),
      site: r.site_name,
      dateScreening: processDate(r.date_screening),
      email: r.email.toLowerCase(),
      mobile: r.mobile_number,
      addBleed: r.add_bleed === 'Yes' || r.study_group_vacc === 'Nested study',
      gender: r.a1_gender,
      dob: processDate(r.a2_dob),
      withdrawn: withdrawnIDs.includes(r.record_id),
      baselineQuestComplete: r.baseline_questionnaire_complete === 'Complete'
    }
  })
}

export async function exportVaccinationHistory () {
  const records = await exportRecords(
    [
      'record_id', 'pid',
      'vac_2015', 'vac_2016', 'vac_2017', 'vac_2018', 'vac_2019'
    ],
    ['baseline_arm_1'], 'flat', false
  )
  const varNames = ['vac_2015', 'vac_2016', 'vac_2017', 'vac_2018', 'vac_2019']
  const years = [2015, 2016, 2017, 2018, 2019]
  // Filter out all non-participants
  const recordsFiltered = records.filter(r => r.pid !== '')
  const recordsLong = []
  recordsFiltered.map(r => {
    for (let i = 0; i < 5; ++i) {
      recordsLong.push({
        redcapRecordId: r.record_id,
        year: years[i],
        status: r[varNames[i]] === '1'
      })
    }
  })
  return recordsLong
}

export async function exportSchedule () {
  const records = await exportRecords(
    [
      'record_id', 'pid',
      'scheduled_date_v0', 'scheduled_date_v7', 'scheduled_date_v14',
      'scheduled_date_v280'
    ],
    ['baseline_arm_1'], 'flat', false
  )
  const varNames = [
    'scheduled_date_v0', 'scheduled_date_v7',
    'scheduled_date_v14', 'scheduled_date_v280'
  ]
  const timepoints = [0, 7, 14, 280]
  // Filter out all non-participants
  // @REVIEW
  // Convert this wide-to-long procedure into a function
  const recordsFiltered = records.filter(r => r.pid !== '')
  const recordsLong = []
  recordsFiltered.map(r => {
    for (let i = 0; i < timepoints.length; ++i) {
      if (r[varNames[i]] === '') continue
      recordsLong.push({
        redcapRecordId: r.record_id,
        day: timepoints[i],
        date: processDate(r[varNames[i]])
      })
    }
  })
  return recordsLong
}

export async function exportWeeklySurveys () {
  const records = await exportRecords(
    [
      'record_id',
      'ari_definition',
      'date_symptom_survey',
      'swab_collection'
    ],
    Array.from(Array(50).keys())
      .map(n => `weekly_survey_${n}_arm_1`), 'flat', false
  )
  // PID won't be present here because it's only present at baseline event
  return records
    .filter(r => r.ari_definition !== '')
    .map(r => ({
      redcapRecordId: r.record_id,
      index: parseInt(r.redcap_event_name
        .match(/weekly_survey_(\d+)_arm_1/)[1]),
      date: processDate(r.date_symptom_survey),
      ari: r.ari_definition === '1',
      swabCollection: r.swab_collection === '' ? null
        : r.swab_collection === '1'
    }))
}
