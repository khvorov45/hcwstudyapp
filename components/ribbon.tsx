import { useState } from 'react'
import { trackPromise } from 'react-promise-tracker'
import { ButtonWithTimestamp, Checkbox, RadioGroup } from './input'
import { accessAPI, toTitleCase, User } from '../lib/util'
import styles from './ribbon.module.css'
import inputStyles from './input.module.css'

export default function Ribbon (
  {
    user, updateDBPromiseArea, afterdbUpdate,
    onAccessGroupChange, elements
  }:
  {
    user: User, updateDBPromiseArea: string,
    afterdbUpdate: () => Promise<void>,
    onAccessGroupChange: (value: string) => void,
    elements: {varselect?: {columns: any, variables: any}}
  }
) {
  return <div className={styles.ribbon}>
    <UpdateDatabaseButton
      email={user.email} token={user.token} promiseArea={updateDBPromiseArea}
      afterdbUpdate={afterdbUpdate}
    />
    <SiteSelect
    // @REVIEW
    // Pull this array from config
      sites={[
        'unrestricted', 'adelaide', 'brisbane', 'melbourne', 'newcastle',
        'perth', 'sydney'
      ]}
      defaultSite={user.accessGroup}
      onChange={onAccessGroupChange}
    />
    {
      elements.varselect &&
      <ColumnSelect
        columns={elements.varselect.columns}
        variables={elements.varselect.variables}
      />
    }
  </div>
}

export function UpdateDatabaseButton (
  { email, token, promiseArea, afterdbUpdate }:
  {
    email: string, token: string, promiseArea: string,
    afterdbUpdate: () => Promise<void>
  }
) {
  async function updateDB () {
    async function updateAndAfter () {
      const date = await accessAPI(
        'update', 'POST', { email: email, token: token }
      )
      await afterdbUpdate()
      setLastUpdate(new Date(date))
    }
    await trackPromise(updateAndAfter(), promiseArea)
  }
  const [lastUpdate, setLastUpdate] = useState(new Date(0))
  return <ButtonWithTimestamp
    label="Update"
    timestamp={lastUpdate}
    onClick={() => updateDB()}
    promiseArea={promiseArea}
  />
}

export function ColumnSelect (
  { columns, variables }:
  {columns: any, variables: any}
) {
  // @REVIEW
  // Put this div into its own class
  return <div
    className={`${inputStyles.input} ${inputStyles.multipleSelect}`}
  >
    {columns.map(column => (
      <Checkbox
        label={variables.filter(v => v.my === column.id)[0].label}
        key={column.id}
        checkboxProps={column.getToggleHiddenProps()}
      />
    ))}
  </div>
}

export function SiteSelect (
  { sites, defaultSite, onChange }:
  {sites: string[], defaultSite: string, onChange: (value: string) => void}
) {
  return <RadioGroup
    name={'sites'}
    onChange={onChange}
    options={
      sites.map(
        s => ({ value: s, label: toTitleCase(s), default: s === defaultSite })
      )
    }
  />
}
