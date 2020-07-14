import { useMemo, useState } from 'react'
import { TextLine } from './input'
import tableStyles from './table.module.css'

/* eslint-disable react/prop-types */

export function DefaultColumnFilter ({
  column: { filterValue, setFilter }
}) {
  const [val, setVal] = useState(filterValue || '')
  return (
    <TextLine
      value={val}
      onChange={e => {
        setVal(e.target.value)
        setFilter(e.target.value || undefined)
      }}
      placeholder={'Search...'}
      width='150px'
    />
  )
}

export function NumberRangeColumnFilter ({
  column: { preFilteredRows, setFilter, id }
}) {
  const [min, max] = useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id], min)
      max = Math.max(row.values[id], max)
    })
    return [min, max]
  }, [id, preFilteredRows])
  const [lowvalue, setLowvalue] = useState('')
  const [highvalue, setHighvalue] = useState('')
  return (
    <div className={tableStyles.numberFilter}>
      <TextLine
        value={lowvalue}
        onChange={e => {
          const val = e.target.value
          setLowvalue(val)
          setFilter(
            (old = []) => [val !== '' ? Number(val) : undefined, old[1]]
          )
        }}
        placeholder={`Min (${min})`}
        type='number'
        width='70px'
      />
      -
      <TextLine
        value={highvalue}
        onChange={e => {
          const val = e.target.value
          setHighvalue(val)
          setFilter(
            (old = []) => [old[0], val !== '' ? Number(val) : undefined]
          )
        }}
        placeholder={`Max (${max})`}
        type='number'
        width='70px'
      />
    </div>
  )
}

export function DatesRangeColumnFilter ({
  column: { setFilter }
}) {
  const [lowvalue, setLowvalue] = useState('')
  const [highvalue, setHighvalue] = useState('')
  return (
    <div className={tableStyles.numberFilter}>
      <TextLine
        value={lowvalue}
        onChange={e => {
          const val = e.target.value
          setLowvalue(val)
          setFilter(
            (old = []) => [val !== '' ? new Date(val) : undefined, old[1]]
          )
        }}
        type='date'
        width='14ch'
      />
      -
      <TextLine
        value={highvalue}
        onChange={e => {
          const val = e.target.value
          setHighvalue(val)
          setFilter(
            (old = []) => [old[0], val !== '' ? new Date(val) : undefined]
          )
        }}
        type='date'
        width='14ch'
      />
    </div>
  )
}
