import { useState, useEffect } from 'react'
import { trackPromise } from 'react-promise-tracker'
import { ButtonWithTimestamp, Checkbox } from './input'
import { accessAPI } from '../lib/util'
import styles from './ribbon.module.css'
import inputStyles from './input.module.css'

export default function Ribbon (
  { email, token, updateDBPromiseArea, afterdbUpdate, columns, variables }:
  {
    email: string, token: string, updateDBPromiseArea: string,
    afterdbUpdate: () => Promise<void>, columns: any, variables: any
  }
) {
  return <div className={styles.ribbon}>
    <UpdateDatabaseButton
      email={email} token={token} promiseArea={updateDBPromiseArea}
      afterdbUpdate={afterdbUpdate}
    />
    <ColumnSelect
      columns={columns} variables={variables}
    />
  </div>
}

export function UpdateDatabaseButton (
  { email, token, promiseArea, afterdbUpdate }:
  {
    email: string, token: string, promiseArea: string,
    afterdbUpdate: () => Promise<void>
  }
) {
  async function updateDB (actuallyThough: boolean) {
    async function updateAndAfter () {
      let date: Date
      if (actuallyThough) {
        date = await accessAPI(
          'update', 'POST', { email: email, token: token }
        )
      } else {
        date = await accessAPI('update', 'GET')
      }
      await afterdbUpdate()
      setLastUpdate(new Date(date))
    }
    await trackPromise(updateAndAfter(), promiseArea)
  }
  useEffect(() => { updateDB(false) }, [])
  const [lastUpdate, setLastUpdate] = useState(new Date(0))
  return <ButtonWithTimestamp
    label="Update"
    timestamp={lastUpdate}
    onClick={() => updateDB(true)}
    promiseArea={promiseArea}
  />
}

export function ColumnSelect (
  { columns, variables }:
  {columns: any, variables: any}
) {
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
