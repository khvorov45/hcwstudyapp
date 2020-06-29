import { useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import Loader from 'react-loader-spinner'
import { usePromiseTracker } from 'react-promise-tracker'
import { isDateISOString } from '../lib/util'
import tableStyles from './table.module.css'

/* eslint-disable react/prop-types, react/jsx-key */

export default function Table ({
  jsonrows, variables, promiseArea, setColumns
}) {
  const { promiseInProgress } = usePromiseTracker({ area: promiseArea })
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
        hiddenColumns: ['accessGroup', 'site', 'dateScreening'],
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
  if (promiseInProgress) {
    return <TableLoader/>
  }
  setColumns(allColumns)
  return <div className={tableStyles.container}>
    <table {...getTableProps()} className={tableStyles.table}>
      <Thead headerGroups={headerGroups}/>
      <Tbody
        rows={rows}
        prepareRow={prepareRow}
        getTableBodyProps={getTableBodyProps}
      />
    </table>
  </div>
}

function ColumnNames ({ label, redcapName }) {
  return <div className={tableStyles.columnNames}>
    <div>{label}</div>
    <div className={tableStyles.columnRedcapName}>{redcapName}</div>
  </div>
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

function TableLoader () {
  return <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    <Loader
      type="ThreeDots" color="var(--font-color)"
      height="100" width="100"
    />
  </div>
}

function Thead ({ headerGroups }) {
  return <thead>
    {headerGroups.map(headerGroup => (
      <tr {...headerGroup.getHeaderGroupProps()}>
        {headerGroup.headers.map(column => (
          <th {...column.getHeaderProps(column.getSortByToggleProps())}>
            <div className={tableStyles.columnHeader}>
              {column.render('Header')}
              <span className={tableStyles.columnController}>
                {column.isSorted
                  ? column.isSortedDesc
                    ? ' ▼'
                    : ' ▲'
                  : ' ⇅'}
              </span>
            </div>
          </th>
        ))}
      </tr>
    ))}
  </thead>
}

function Tbody ({ rows, prepareRow, getTableBodyProps }) {
  return <tbody {...getTableBodyProps()}>
    {rows.map(row => {
      prepareRow(row)
      return (
        <tr {...row.getRowProps()}>
          {row.cells.map(cell => {
            return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
          })}
        </tr>
      )
    })}
  </tbody>
}
