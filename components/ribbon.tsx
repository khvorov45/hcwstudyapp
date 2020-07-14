import { useState, useEffect, ReactNode } from 'react'
import { trackPromise } from 'react-promise-tracker'
import { Button, ButtonWithTimestamp, Checkbox, RadioGroup } from './input'
import { accessAPI, toTitleCase, User } from '../lib/util'
import { CSVLink } from 'react-csv'
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
    elements: {
      varselect?: {columns: any, variables: any},
      filters?: {
        id: string, label: string, defaultValue: any, fun: (a: any) => void
      }[]
    }
  }
) {
  return <div className={styles.ribbon}>
    <UpdateDatabaseButton
      email={user.email} token={user.token} promiseArea={updateDBPromiseArea}
      afterdbUpdate={afterdbUpdate}
    />
    {
      ['admin', 'unrestricted'].includes(user.accessGroup) && <SiteSelect
        // @REVIEW
        // Pull this array from config
        sites={[
          'unrestricted', 'adelaide', 'brisbane', 'melbourne', 'newcastle',
          'perth', 'sydney'
        ]}
        defaultSite={
          user.accessGroup === 'admin' ? 'unrestricted' : user.accessGroup
        }
        onChange={onAccessGroupChange}
      />
    }

    {
      elements.varselect &&
      <ColumnSelect
        columns={elements.varselect.columns}
        variables={elements.varselect.variables}
      />
    }
    {
      elements.filters &&
      elements.filters.map(
        el => <Filter
          key={el.id} label={el.label}
          defaultValue={el.defaultValue} fun={el.fun}
        />
      )
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
      date && setLastUpdate(new Date(date))
    }
    await trackPromise(updateAndAfter(), promiseArea)
  }
  useEffect(() => {
    trackPromise(accessAPI('update', 'GET'), promiseArea)
      .then((d) => setLastUpdate(new Date(d)))
  }, [])
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
    {columns.map(column => {
      const varinfo = variables.filter(v => v.my === column.id)[0]
      return <Checkbox
        label={varinfo ? varinfo.label : column.id}
        key={column.id}
        checkboxProps={column.getToggleHiddenProps()}
      />
    })}
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

function Filter (
  { label, defaultValue, fun }:
  {label: string, defaultValue: any, fun: (newValue: any) => void}
) {
  return <RadioGroup
    name={'withdrawn'}
    onChange={fun}
    options={[
      { value: 'any', label: 'Any', default: defaultValue === 'any' },
      { value: 'yes', label: 'Yes', default: defaultValue === 'yes' },
      { value: 'no', label: 'No', default: defaultValue === 'no' }
    ]}
    label={label}
  />
}

export function Download (
  { data, buttonClassName, filename }:
  {data: any, buttonClassName?: string, filename?: string}
) {
  return <>
    <CSVLink
      filename={filename || 'table.csv'}
      data={data}
      className={styles.download}
    >
      <Button onClick={() => {}}
        className={buttonClassName || ''}
      >
        <i className='material-icons'>get_app</i>
      </Button>
    </CSVLink>
  </>
}

export function Strip (
  { children, style }:
  {children: ReactNode, style?: any}
) {
  return <div className={styles.strip} style={style}>
    {children}
  </div>
}

export function ButtonStrip (
  { children, style }:
  {children: ReactNode, style?: any}
) {
  return <div className={styles.buttonstrip} style={style}>
    {children}
  </div>
}
