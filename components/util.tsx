import { usePromiseTracker } from 'react-promise-tracker'
import Loader from 'react-loader-spinner'
import styles from './util.module.css'
import { myFormatDate } from '../lib/util'

export function Timestamp (
  { promiseArea, timestamp }:
  {promiseArea: string, timestamp?: Date}
) {
  const { promiseInProgress } = usePromiseTracker({ area: promiseArea })
  const timestring = myFormatDate(timestamp || new Date())
  const underlast = promiseInProgress
    ? <div className={styles.underlast}>
      <Loader
        type="TailSpin" color="var(--font-color)"
        height="25px" width="25px"
      />
    </div>
    : <div className={styles.underlast}>
      <div>{timestring.datePart}</div>
      <div>{timestring.timePart}</div>
    </div>
  return <div className={styles.timestamp}>
    Last:
    {underlast}
  </div>
}
