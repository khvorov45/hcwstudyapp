import inputStyles from './input.module.css'
import styles from './button.module.css'

export default function ButtonWithIndicator (props: {
  success: boolean, type: string, value: string
}) {
  return <div className={styles.container}>
    <input
      className={`${inputStyles.input} ${styles.button}`}
      type={props.type}
      value={props.value}
    />
    <SuccessIndicator success={props.success} />
  </div>
}

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
