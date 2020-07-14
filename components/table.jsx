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
    {headerGroups.map((headerGroup, i) => (
      <HeaderRow
        key={i}
        getHeaderGroupProps={headerGroup.getHeaderGroupProps}
        headers={headerGroup.headers}
      />
    ))}
  </thead>
}

function HeaderRow ({ getHeaderGroupProps, headers }) {
  return <tr
    {...getHeaderGroupProps()}
    className={
      headers.map(c => c.originalId)
        .includes('control-header')
        ? tableStyles.control
        : ''
    }
  >
    {headers.map(column => (
      <HeaderCell
        key={column.id}
        getHeaderProps={column.getHeaderProps}
        getSortByToggleProps={column.getSortByToggleProps}
        render={column.render}
        isSorted={column.isSorted}
        isSortedDesc={column.isSortedDesc}
        canFilter={column.canFilter}
      />
    ))}
  </tr>
}

function HeaderCell ({
  getHeaderProps, getSortByToggleProps,
  render, isSorted, isSortedDesc, canFilter
}) {
  return <th {...getHeaderProps()}>
    <div className={tableStyles.columnHeader}>
      {
        getSortByToggleProps
          ? <>
            <div
              className={tableStyles.columnHeaderClickable}
              {...getSortByToggleProps()}
            >
              {render('Header')}
              <span className={tableStyles.columnController}>
                {isSorted
                  ? isSortedDesc
                    ? ' ▼'
                    : ' ▲'
                  : ' ⇅'}
              </span>
            </div>
          </>
          : <div>
            {render('Header')}
          </div>
      }
      <div>{canFilter && render('Filter')}</div>
    </div>
  </th>
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
