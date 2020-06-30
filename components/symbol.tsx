import styles from './symbol.module.css'
import { usePromiseTracker } from 'react-promise-tracker'
import Loader from 'react-loader-spinner'

export function SuccessIndicator (props: {success?: boolean}) {
  const { promiseInProgress } = usePromiseTracker()
  if (promiseInProgress) {
    // @PROBLEM
    // CSS variables for height and weight do not work on chrome here
    return <Loader
      type="TailSpin" color="var(--font-color)"
      height="25px" width="25px"
    />
  }
  if (props.success === undefined) {
    return <i
      className={`${styles.invisible} material-icons`}>
  check_circle_outline
    </i>
  }
  return props.success ? <i
    className={`${styles.success} material-icons`}>
    check_circle_outline
  </i>
    : <i
      className={`${styles.failure} material-icons`}>
  highlight_off
    </i>
}
