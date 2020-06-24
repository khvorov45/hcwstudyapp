import { useState, useEffect } from 'react'
import { trackPromise } from 'react-promise-tracker'
import { ButtonWithTimestamp } from './input'
import { fetchOwnApi, accessAPI } from '../lib/util'
import styles from './ribbon.module.css'

export default function Ribbon (
  { email, token, afterdbUpdate }:
  {email: string, token: string, afterdbUpdate: () => Promise<void>}
) {
  return <div className={styles.ribbon}>
    <UpdateDatabaseButton
      email={email} token={token} afterdbUpdate={afterdbUpdate}
    />
  </div>
}

export function UpdateDatabaseButton (
  { email, token, afterdbUpdate }:
  {email: string, token: string, afterdbUpdate: () => Promise<void>}
) {
  async function updateDB () {
    async function updateAndAfter () {
      const date = await fetchOwnApi(email, token, 'update')
      await afterdbUpdate()
      setLastUpdate(new Date(date))
    }
    await trackPromise(updateAndAfter(), 'updatedb')
  }
  // Don't want to update the database on every mount, just fetch when
  // it was last updated
  async function dontUpdateDB () {
    async function dontUpdateAndAfter () {
      const date = await accessAPI('update', 'GET')
      await afterdbUpdate()
      setLastUpdate(new Date(date))
    }
    await trackPromise(dontUpdateAndAfter(), 'updatedb')
  }
  useEffect(() => { dontUpdateDB() }, [])
  const [lastUpdate, setLastUpdate] = useState(new Date(0))
  return <ButtonWithTimestamp
    label="Update"
    timestamp={lastUpdate}
    onClick={updateDB}
    promiseArea='updatedb'
  />
}
