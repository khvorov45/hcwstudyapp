import styles from './symbol.module.css'

export function SuccessIndicator (props: {success?: boolean}) {
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
