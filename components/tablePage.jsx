import { useMemo, useState, useEffect } from 'react'
import { useTable, useSortBy, usePagination, useFilters } from 'react-table'
import Table from './table'
import {
  isDateISOString, fetchParticipantData
} from '../lib/util'
import Ribbon from './ribbon'
import tableStyles from './table.module.css'
import { Button, TextLine } from './input'

/* eslint-disable react/prop-types, react/jsx-key */

export default function TablePage (
  { user, tableName, variables, hidden }
) {
  // This state
  const [accessGroup, setAccessGroup] = useState(
    user.accessGroup === 'admin' ? 'unrestricted' : user.accessGroup
  )
  const [jsonrows, setData] = useState([])
  // Data updating
  async function updateData () {
    if (!user.authorised) return
    setData(await fetchParticipantData(user, tableName, accessGroup))
  }
  useEffect(() => { updateData() }, [accessGroup])
  // Table generation
  const data = useMemo(() => jsonrows, [jsonrows])
  const columns = useMemo(
    () => generateColumns(data, variables),
    [jsonrows]
  )
  const paginationThreshold = 100
  const defaultColumn = useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter
    }),
    []
  )
  const filterTypes = useMemo(
    () => ({
      betweenDates: (rows, ids, filterValue) => {
        let [min, max] = filterValue || []

        min = min instanceof Date ? min : -Infinity
        max = max instanceof Date ? max : Infinity

        if (min > max) {
          const temp = min
          min = max
          max = temp
        }
        return rows.filter(row => {
          return ids.some(id => {
            const rowValue = new Date(row.values[id])
            return rowValue >= min && rowValue <= max
          })
        })
      }
    }),
    []
  )
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    allColumns,
    page,
    nextPage,
    previousPage,
    pageCount,
    canPreviousPage,
    canNextPage,
    setPageSize,
    state: { pageIndex }
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      filterTypes,
      initialState: {
        hiddenColumns: hidden,
        sortBy: [
          {
            id: 'pid',
            desc: false
          }
        ],
        pageSize: paginationThreshold
      }
    },
    useFilters,
    useSortBy,
    usePagination
  )
  return <>
    <Ribbon
      user={user}
      updateDBPromiseArea="updatedb"
      afterdbUpdate={updateData}
      onAccessGroupChange={(value) => { setAccessGroup(value) }}
      elements={{
        varselect: { columns: allColumns, variables: variables }
      }}
    />
    <Paginator
      nextPage={nextPage}
      previousPage={previousPage}
      pageIndex={pageIndex}
      pageCount={pageCount}
      canPreviousPage={canPreviousPage}
      canNextPage={canNextPage}
      pageSizeLow={paginationThreshold}
      pageSizeMax={rows.length}
      setPageSize={setPageSize}
      totalRows={rows.length}
    />
    <Table
      getTableProps={getTableProps}
      headerGroups={headerGroups}
      rows={page}
      prepareRow={prepareRow}
      getTableBodyProps={getTableBodyProps}
      promiseArea="updatedb"
    />
  </>
}

function generateColumns (data, variables) {
  if (!data) return []
  const exampleRow = data[0]
  const cols = []
  for (const fieldname in exampleRow) {
    const varinfo = variables.filter(v => v.my === fieldname)[0]
    cols.push({
      Header: <ColumnNames
        label={varinfo ? varinfo.label : fieldname}
        redcapName={varinfo ? varinfo.redcap : ''}
      />,
      id: fieldname,
      accessor: (row) => {
        if (isDateISOString(row[fieldname])) {
          return row[fieldname].split('T')[0]
        }
        if (typeof row[fieldname] === 'boolean') {
          return row[fieldname] ? 'Yes' : 'No'
        }
        return row[fieldname]
      },
      Filter: varinfo
        ? (varinfo.filter ? MYFILTERS[varinfo.filter] : DefaultColumnFilter)
        : DefaultColumnFilter,
      filter: varinfo
        ? varinfo.filter ||
          (typeof exampleRow[fieldname] === 'number' ? 'exactText' : 'text')
        : 'text'
    })
  }
  return cols
}

function ColumnNames ({ label, redcapName }) {
  return <div className={tableStyles.columnNames}>
    <div>{label}</div>
    <div className={tableStyles.columnRedcapName}>{redcapName}</div>
  </div>
}

function Paginator ({
  nextPage, previousPage, pageIndex, pageCount, canPreviousPage, canNextPage,
  pageSizeLow, pageSizeMax, setPageSize, totalRows
}) {
  const [max, setMax] = useState(false)
  function updateMax () {
    max ? setPageSize(pageSizeLow) : setPageSize(pageSizeMax)
    setMax(!max)
  }
  return <div className={tableStyles.paginator}>
    <span className={tableStyles.rowcount}>Total rows: {totalRows}</span>
    {
      (pageSizeLow < pageSizeMax) && (
        <>
          <Button onClick={updateMax} label={max ? 'Pages' : 'All'}
            className={tableStyles.pageswitchButton}
          />
          {!max && <>
            <Button
              onClick={previousPage} disabled={!canPreviousPage} label='<'
              className={tableStyles.pageswitchButton}
            />
            <span>{`${pageIndex + 1} (${pageCount})`}</span>
            <Button onClick={nextPage} disabled={!canNextPage} label='>'
              className={tableStyles.pageswitchButton}
            /> </>}
        </>
      )
    }

  </div>
}

function DefaultColumnFilter ({
  column: { setFilter }
}) {
  const [val, setVal] = useState('')
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

const MYFILTERS = {
  between: NumberRangeColumnFilter,
  betweenDates: DatesRangeColumnFilter
}

function NumberRangeColumnFilter ({
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

function DatesRangeColumnFilter ({
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
