import { ButtonWithTimestamp } from './input'
import { trackPromise } from 'react-promise-tracker'
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
  function updateDB () {
    return trackPromise(
      fetchOwnApi(id, token, 'update'), 'updatedb'
    )
  }
  return <ButtonWithTimestamp label="Update" onClick={updateDB} />
}
