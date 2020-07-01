import { useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import Table from './table'
import { isDateISOString } from '../lib/util'
import Ribbon from './ribbon'
import tableStyles from './table.module.css'

/* eslint-disable react/prop-types, react/jsx-key */

export default function TablePage (
  { jsonrows, updateData, email, token, variables, hidden }
) {
  const data = useMemo(() => jsonrows, [jsonrows])
  const columns = useMemo(
    () => generateColumns(data[0], variables),
    [jsonrows]
  )
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    allColumns
  } = useTable(
    {
      columns,
      data,
      initialState: {
        hiddenColumns: hidden,
        sortBy: [
          {
            id: 'pid',
            desc: false
          }
        ]
      }
    },
    useSortBy
  )
  return <>
    <Ribbon
      email={email}
      token={token}
      updateDBPromiseArea="updatedb"
      afterdbUpdate={updateData}
      elements={{
        varselect: { columns: allColumns, variables: variables }
      }}
    />
    <Table
      getTableProps={getTableProps}
      headerGroups={headerGroups}
      rows={rows}
      prepareRow={prepareRow}
      getTableBodyProps={getTableBodyProps}
      promiseArea="updatedb"
    />
  </>
}

function generateColumns (exampleRow, variables) {
  const cols = []
  for (const fieldname in exampleRow) {
    const varinfo = variables.filter(v => v.my === fieldname)[0]
    cols.push({
      Header: <ColumnNames
        label={varinfo.label}
        redcapName={varinfo.redcap}
      />,
      id: fieldname,
      accessor: (row) => {
        if (isDateISOString(row[fieldname])) {
          return row[fieldname].split('T')[0]
        }
        return row[fieldname]
      }
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
