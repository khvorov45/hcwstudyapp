import config from './config'

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
        type: type,
        exportDataAccessGroups: 'true',
        rawOrLabel: 'label',
        fields: fields.toString(),
        events: events.toString()
      }).toString()
    }
  )
  return await redcapres.json()
}
