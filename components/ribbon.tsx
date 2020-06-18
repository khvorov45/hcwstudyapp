import { useState, useEffect } from 'react'
import { trackPromise } from 'react-promise-tracker'
import { ButtonWithTimestamp } from './input'
import { fetchOwnApi } from '../lib/util'
import styles from './ribbon.module.css'

export default function Ribbon (
  { id, token }: {id: number, token: string}
) {
  return <div className={styles.ribbon}>
    <UpdateDatabaseButton id={id} token={token} />
  </div>
}

export function UpdateDatabaseButton (
  { id, token }: {id: number, token: string}
) {
  async function updateDB () {
    const date = await trackPromise(
      fetchOwnApi(id, token, 'update'), 'updatedb'
    )
    return setLastUpdate(new Date(date))
  }
  useEffect(() => { updateDB() }, [])
  const [lastUpdate, setLastUpdate] = useState(new Date(0))
  return <ButtonWithTimestamp
    label="Update" timestamp={lastUpdate} onClick={updateDB}
  />
}
