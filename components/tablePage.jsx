import { useMemo, useState, useEffect } from 'react'
import { useTable, useSortBy } from 'react-table'
import Table from './table'
import { isDateISOString, accessAPI } from '../lib/util'
import Ribbon from './ribbon'
import tableStyles from './table.module.css'

/* eslint-disable react/prop-types, react/jsx-key */

async function fetchData (user, tableName, accessGroup) {
  return await accessAPI(
    'getparticipants', 'GET',
    {
      email: user.email,
      token: user.token,
      subset: tableName,
      accessGroup: accessGroup
    }
  )
}

export default function TablePage (
  { user, tableName, variables, hidden }
) {
  // Handle access group change
  const [accessGroup, setAccessGroup] = useState(
    user.accessGroup === 'admin' ? 'unrestricted' : user.accessGroup
  )
  function onAccessGroupChange (value) {
    console.log('set access group to ' + value)
    setAccessGroup(value)
  }
  // Initial data can be empty
  const [jsonrows, setData] = useState([])
  // Data updating
  async function updateData () {
    console.log(
      'called updatedata in tablepage with access group ' + accessGroup
    )
    setData(await fetchData(user, tableName, accessGroup))
  }
  useEffect(() => {
    updateData()
  }, [accessGroup])
  // Table generation
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
      user={user}
      updateDBPromiseArea="updatedb"
      afterdbUpdate={updateData}
      onAccessGroupChange={onAccessGroupChange}
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
