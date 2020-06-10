import { useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import tableStyles from './table.module.css'

/* eslint-disable react/prop-types, react/jsx-key */

export default function Table ({ jsonRows }) {
  console.log(jsonRows)
  const data = useMemo(() => jsonRows, [])
  const columns = useMemo(
    () => [
      {
        Header: 'REDCap ID',
        accessor: 'redcapRecordId'
      },
      {
        Header: 'PID',
        accessor: 'pid'
      },
      {
        Header: 'Site',
        accessor: 'site'
      }
    ],
    []
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
  return <table {...getTableProps()} className={tableStyles.table}>
    <thead>
      {headerGroups.map(headerGroup => (
        <tr {...headerGroup.getHeaderGroupProps()}>
          {headerGroup.headers.map(column => (
            <th {...column.getHeaderProps(column.getSortByToggleProps())}>
              {column.render('Header')}
              <span>
                {column.isSorted
                  ? column.isSortedDesc
                    ? ' ▼'
                    : ' ▲'
                  : ' ⇅'}
              </span>
            </th>
          ))}
        </tr>
      ))}
    </thead>
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
}
