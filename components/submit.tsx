import inputStyles from './input.module.css'

export function SubmitButton () {
  return <input
    className={`${inputStyles.input} ${inputStyles.submitButton}`}
    type="submit"
    value="Submit"
  />
}

export default function SubmitContainer (props: {success?: boolean}) {
  return <div className={inputStyles.submitContainer}>
    <SubmitButton />
    <SuccessIndicator success={props.success} />
  </div>
}

export function SuccessIndicator (props: {success?: boolean}) {
  if (props.success === undefined) {
    return <i
      className={`${inputStyles.invisibleIndicator} material-icons`}>
  check_circle_outline
    </i>
  }
  return props.success ? <i
    className={`${inputStyles.successIndicator} material-icons`}>
    check_circle_outline
  </i>
    : <i
      className={`${inputStyles.failureIndicator} material-icons`}>
  highlight_off
    </i>
}
