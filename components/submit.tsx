import ButtonWithIndicator from './button'
import styles from './submit.module.css'

export default function SubmitContainer (props: {
  success?: boolean, errormsg: string
}) {
  let errormsg = <></>
  if (props.success === false) {
    errormsg = <p className={styles.errormsg}>{props.errormsg}</p>
  }
  return <div className={styles.container}>
    <ButtonWithIndicator success={props.success} type="submit" value="Submit" />
    {errormsg}
  </div>
}
