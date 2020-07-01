import { SuccessIndicator } from './symbol'
import { Timestamp } from './util'
import { toTitleCase } from '../lib/util'
import styles from './input.module.css'

export function ButtonWithTimestamp (
  { label, onClick, promiseArea, timestamp }:
  {label: string, onClick: () => void, promiseArea: string, timestamp?: Date}
) {
  return <button
    className={`${styles.input} ${styles.bigbutton}`}
    onClick={onClick}
  >
    {label}
    <Timestamp promiseArea={promiseArea} timestamp={timestamp} />
  </button>
}

export function ButtonWithIndicator (props: {
  success: boolean, type: string, value: string, errormsg?: string
}) {
  let errormsg = <></>
  if (props.success === false) {
    errormsg = <div
      className={`${styles.linemsg} ${styles.errormsg}`}
    >
      {props.errormsg}
    </div>
  }
  return <div className={styles.verticalContainerCenter}>
    <div className={styles.horizontalContainerCenter}>
      <input
        className={`${styles.input} ${styles.button}`}
        type={props.type}
        value={props.value}
      />
      <SuccessIndicator success={props.success} />
    </div>
    {errormsg}
  </div>
}

export function TextLine (
  props: {
    value: string, onChange: any, type: string,
    id?: string, placeholder?: string
}
) {
  return <input
    className={`${styles.input} ${styles.textLine}`}
    id={props.id}
    type={props.type}
    value={props.value}
    onChange={props.onChange}
    placeholder={props.placeholder}
  />
}

export function TextLineLabelled (
  props: {
    label: string, value: string, onChange: any, type: string,
    id: string, placeholder?: string
}
) {
  return <div className={styles.verticalContainerCenter}>
    <label className={styles.linemsg} htmlFor={props.id}>{props.label}</label>
    <TextLine
      id={props.id}
      type={props.type}
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder}
    />
  </div>
}

export function Form (props: {
  children: React.ReactNode, onSubmit: any, success: boolean, errormsg?: string
}) {
  return (
    <form className={styles.verticalContainerCenter} onSubmit={props.onSubmit}>
      {props.children}
      <ButtonWithIndicator
        success={props.success}
        type="submit"
        value="Submit"
        errormsg={props.errormsg}
      />
    </form>
  )
}

export function Checkbox (
  { label, checkboxProps }:
  {label: string, checkboxProps?: any}
) {
  return <label className={styles.checkbox}>
    <input type="checkbox" {...checkboxProps} />
    <span className={styles.actualCheckbox}></span>
    {label}
  </label>
}

export function Select (
  { options, onChange }: {options: string[], onChange: (event) => void}
) {
  return <select
    className={`${styles.input} ${styles.select}`}
    onChange={onChange}
  >
    {
      options.map(
        (opt) => <option
          key={opt} value={opt}>
          {toTitleCase(opt)}
        </option>
      )
    }
  </select>
}
