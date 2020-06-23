import { useState, useEffect } from 'react'
import { trackPromise } from 'react-promise-tracker'
import { ButtonWithTimestamp } from './input'
import { fetchOwnApi } from '../lib/util'
import styles from './ribbon.module.css'

export default function Ribbon (
  { id, token, afterdbUpdate }:
  {id: number, token: string, afterdbUpdate: () => Promise<void>}
) {
  return <div className={styles.ribbon}>
    <UpdateDatabaseButton id={id} token={token} afterdbUpdate={afterdbUpdate} />
  </div>
}

export function UpdateDatabaseButton (
  { id, token, afterdbUpdate }:
  {id: number, token: string, afterdbUpdate: () => Promise<void>}
) {
  async function updateDB () {
    async function updateAndAfter () {
      const date = await fetchOwnApi(id, token, 'update')
      await afterdbUpdate()
      setLastUpdate(new Date(date))
    }
    await trackPromise(updateAndAfter(), 'updatedb')
  }
  useEffect(() => { updateDB() }, [])
  const [lastUpdate, setLastUpdate] = useState(new Date(0))
  return <ButtonWithTimestamp
    label="Update"
    timestamp={lastUpdate}
    onClick={updateDB}
    promiseArea='updatedb'
  />
}
