import Loader from 'react-loader-spinner'
import { usePromiseTracker } from 'react-promise-tracker'
import tableStyles from './table.module.css'

/* eslint-disable react/prop-types, react/jsx-key */

export default function Table ({
  getTableProps, headerGroups, rows, prepareRow, getTableBodyProps,
  promiseArea
}) {
  const { promiseInProgress } = usePromiseTracker({ area: promiseArea })
  if (promiseInProgress) {
    return <TableLoader/>
  }
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

function TableLoader () {
  // @REVIEW
  // Put this style into a css sheet
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
          <th {...column.getHeaderProps()}>
            <div className={tableStyles.columnHeader}>
              {
                column.getSortByToggleProps
                  ? <>
                    <div
                      className={tableStyles.columnHeaderClickable}
                      {...column.getSortByToggleProps()}
                    >
                      {column.render('Header')}
                      <span className={tableStyles.columnController}>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? ' ▼'
                            : ' ▲'
                          : ' ⇅'}
                      </span>
                    </div>
                  </>
                  : <div>
                    {column.render('Header')}
                  </div>
              }
              <div>{column.canFilter && column.render('Filter')}</div>
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
