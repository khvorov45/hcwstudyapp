import Head from 'next/head'
import { useState, useMemo } from 'react'
import { useTable, useSortBy } from 'react-table'
import Layout from '../../components/layout'
import Table from '../../components/table'
import { SubnavbarTables } from '../../components/navbar'
import { accessAPI, isDateISOString } from '../../lib/util'
import Ribbon from '../../components/ribbon'
import { newconfig } from '../../lib/config'
import db from '../../lib/db'
import tableStyles from '../../components/table.module.css'

/* eslint-disable react/prop-types, react/jsx-key */

export default function ParticipantTable (
  { authorised, email, token, variables }
) {
  const [jsonrows, setData] = useState([])
  async function updateData () {
    setData(await accessAPI(
      'getparticipants', 'GET',
      { email: email, token: token }
    ))
  }
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
  return (
    <Layout
      authorised={authorised}
      email={email}
      token={token}
      active="tables"
    >
      <Head>
        <title>Participants - HCW flu study</title>
        <meta name="Description" content="Contact - HCW flu study" />
      </Head>
      <SubnavbarTables
        authorised={authorised}
        email={email}
        token={token}
        active = "contact"
      />
      <Ribbon
        email={email}
        token={token}
        updateDBPromiseArea="updatedb"
        afterdbUpdate={updateData}
        columns={allColumns}
        variables={variables}
      />
      <Table
        getTableProps={getTableProps}
        headerGroups={headerGroups}
        rows={rows}
        prepareRow={prepareRow}
        getTableBodyProps={getTableBodyProps}
        promiseArea="updatedb"
      />
    </Layout>
  )
}

export async function getServerSideProps (context) {
  return {
    props: {
      authorised: await db.authoriseUser(
        context.query.email, context.query.token
      ),
      email: context.query.email || null,
      token: context.query.token || null,
      variables: newconfig.db.variables.Participant
    }
  }
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
