import { useMemo, useState, useEffect } from 'react'
import { useTable, useSortBy, usePagination, useFilters } from 'react-table'
import Table from './table'
import { isDateISOString, fetchParticipantData } from '../lib/util'
import Ribbon from './ribbon'
import tableStyles from './table.module.css'
import { Button, TextLine, NumberLine } from './input'

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
  const paginationThreshold = 1000
  const defaultColumn = useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter
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
    {rows.length > paginationThreshold &&
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
    />}
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
      Filter: varinfo.filter ? MYFILTERS[varinfo.filter] : DefaultColumnFilter,
      filter: varinfo.filter ||
        (typeof exampleRow[fieldname] === 'number' ? 'exactText' : 'text')
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
  pageSizeLow, pageSizeMax, setPageSize
}) {
  const [max, setMax] = useState(false)
  function updateMax () {
    max ? setPageSize(pageSizeLow) : setPageSize(pageSizeMax)
    setMax(!max)
  }
  return <div className={tableStyles.paginator}>
    {
      !max && <>
        <Button onClick={previousPage} disabled={!canPreviousPage} label='<'/>
        <span>{`${pageIndex + 1} (${pageCount})`}</span>
        <Button onClick={nextPage} disabled={!canNextPage} label='>'/>
      </>
    }
    <Button onClick={updateMax} label={max ? 'Pages' : 'All'}/>
  </div>
}

function DefaultColumnFilter ({
  column: { filterValue, preFilteredRows, setFilter }
}) {
  return (
    <TextLine
      value={filterValue || ''}
      onChange={e => {
        // Set undefined to remove the filter entirely
        setFilter(e.target.value || undefined)
      }}
      placeholder={`Search ${preFilteredRows.length} rows...`}
    />
  )
}

const MYFILTERS = {
  between: NumberRangeColumnFilter
}

function NumberRangeColumnFilter ({
  column: { filterValue = [], preFilteredRows, setFilter, id }
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

  return (
    <div className={tableStyles.numberFilter}>
      <NumberLine
        value={filterValue[0] || ''}
        onChange={e => {
          const val = e.target.value
          setFilter((old = []) => [val ? parseInt(val, 10) : undefined, old[1]])
        }}
        placeholder={`Min (${min})`}
      />
      -
      <NumberLine
        value={filterValue[1] || ''}
        onChange={e => {
          const val = e.target.value
          setFilter((old = []) => [old[0], val ? parseInt(val, 10) : undefined])
        }}
        placeholder={`Max (${max})`}
      />
    </div>
  )
}
