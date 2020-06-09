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
        // With 'flat' - lots of NA
        // With 'eav' - can't export redcap_data_access_group
        type: 'eav',
        exportDataAccessGroups: 'true',
        rawOrLabel: 'label',
        fields: [
          // 'record_id', 'redcap_data_access_group',
          // 'redcap_repeat_instrument', 'redcap_repeat_instance',
          // 'redcap_event_name', 'redcap_data_access_group',
          'pid', 'site_name'
        ].toString()
      }).toString()
    }
  )
  return await redcapres.json()
}
