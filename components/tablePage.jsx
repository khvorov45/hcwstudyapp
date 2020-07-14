import { useMemo, useState, useEffect } from 'react'
import { useTable, useSortBy, usePagination, useFilters } from 'react-table'
import Table from './table'
import {
  isDateISOString, fetchParticipantData, getWeek
} from '../lib/util'
import Ribbon, { Download, Strip } from './ribbon'
import tableStyles from './table.module.css'
import { Button } from './input'
import {
  DefaultColumnFilter, NumberRangeColumnFilter, DatesRangeColumnFilter
} from './tableFilter'

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
  useEffect(() => {
    setAccessGroup(
      user.accessGroup === 'admin' ? 'unrestricted' : user.accessGroup
    )
  }, [user])
  // Table generation
  const data = useMemo(() => jsonrows, [jsonrows])
  const columns = useMemo(
    () => generateColumns(data, variables),
    [jsonrows]
  )
  const paginationThreshold = 17
  const defaultColumn = useMemo(
    () => ({
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
        pageSize: paginationThreshold,
        filters: [{ id: 'withdrawn', value: 'No' }]
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
    <Strip>
      <Download data={rows.map(r => r.values)} filename={`${tableName}.csv`} />
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
      {
        ['weeklycompletion', 'weeklysurvey'].includes(tableName) &&
      <LatestWeekIndex/>
      }
    </Strip>
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
        if (row[fieldname] instanceof Array) {
          return row[fieldname].join(' ')
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

const MYFILTERS = {
  between: NumberRangeColumnFilter,
  betweenDates: DatesRangeColumnFilter
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
          />
          {!max && <>
            <Button
              onClick={previousPage} disabled={!canPreviousPage} label='<'
            />
            <span>{`${pageIndex + 1} (${pageCount})`}</span>
            <Button onClick={nextPage} disabled={!canNextPage} label='>'
            /> </>}
        </>
      )
    }

  </div>
}

function LatestWeekIndex () {
  return <div className={tableStyles.latestWeekIndex}>
    Latest week: {getWeek(new Date()) - 15}
  </div>
}
