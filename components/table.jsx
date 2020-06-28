import { useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import Loader from 'react-loader-spinner'
import { isDateISOString } from '../lib/util'
import tableStyles from './table.module.css'

/* eslint-disable react/prop-types, react/jsx-key */

function ColumnNames ({ label, redcapName }) {
  return <div className={tableStyles.columnNames}>
    <div>{label}</div>
    <div className={tableStyles.columnRedcapName}>{redcapName}</div>
  </div>
}

export default function Table ({ jsonrows, variables }) {
  if (jsonrows === null) {
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
  const data = useMemo(() => jsonrows, [jsonrows])
  const columns = useMemo(
    () => {
      const cols = []
      const exampleRow = data[0]
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
    },
    [jsonrows]
  )
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data,
      initialState: {
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
  return <div className={tableStyles.container}>
    <table {...getTableProps()} className={tableStyles.table}>
      <Thead headerGroups={headerGroups}/>
      <tbody {...getTableBodyProps()}>
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
    </table>
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
