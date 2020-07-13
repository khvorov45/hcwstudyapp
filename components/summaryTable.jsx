import { useMemo } from 'react'
import { useTable } from 'react-table'
import Table from './table'
import { toTitleCase } from '../lib/util'
import { Download } from './ribbon'
import tableStyles from './table.module.css'

/* eslint-disable react/prop-types, react/jsx-key */

export default function SummaryTable ({ jsonrows }) {
  const uniqueSites = jsonrows
    .map(r => r.accessGroup)
    .filter((g, i, self) => self.indexOf(g) === i)
  const rowsWide = Array.from(Array(6).keys()).map(i => {
    const row = { numSeasVac: i }
    uniqueSites.map(
      s => {
        const neededRow = jsonrows
          .filter(r => r.accessGroup === s && r.numSeasVac === i)[0]
        if (neededRow) {
          row[s] = neededRow.count
        }
      }
    )
    if (uniqueSites.length > 1) {
      let total = 0
      uniqueSites.map(s => { total += row[s] || 0 })
      row.total = total
    }
    return row
  })
  const bottomTotal = { numSeasVac: 'Total' }
  uniqueSites.map(s => {
    bottomTotal[s] = 0
    rowsWide.map(r => { bottomTotal[s] += r[s] || 0 })
  })
  if (uniqueSites.length > 1) {
    bottomTotal.total = 0
    rowsWide.map(r => { bottomTotal.total += r.total || 0 })
  }
  rowsWide.push(bottomTotal)
  const data = useMemo(
    () => rowsWide,
    [jsonrows]
  )
  const columns = useMemo(
    () => {
      const siteHeaders = [
        {
          Header: <>
            <Download
              filename='summary.csv'
              data={data}
            />
          </>,
          id: 'first',
          columns: [{
            Header: 'Previous vaccinations',
            accessor: 'numSeasVac'
          }]
        },
        {
          Header: 'Site',
          columns: uniqueSites.map(s => ({
            Header: toTitleCase(s),
            accessor: s
          }))
        }
      ]
      if (uniqueSites.length > 1) {
        return siteHeaders.concat([
          {
            Header: 'Total',
            accessor: 'total'
          }
        ])
      }
      return siteHeaders
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
      data
    }
  )
  return <Table
    getTableProps={getTableProps}
    headerGroups={headerGroups}
    rows={rows}
    prepareRow={prepareRow}
    getTableBodyProps={getTableBodyProps}
    promiseArea="updatedb"
  />
}
