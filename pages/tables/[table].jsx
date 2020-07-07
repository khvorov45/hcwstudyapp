import Head from 'next/head'
import { toTitleCase, accessAPI } from '../../lib/util'
import TablePage from '../../components/tablePage'
import Layout from '../../components/layout'
import { SubnavbarTables } from '../../components/navbar'
import { useRouter } from 'next/router'
import { useUser } from '../../lib/hooks'
import { useState, useEffect } from 'react'

/* eslint-disable react/prop-types, react/jsx-key */

export default function ParticipantTable () {
  const user = useUser()
  const router = useRouter()
  const { table } = router.query
  const [variables, setVariables] = useState()
  useEffect(
    () => { accessAPI('getvariables', 'GET').then(vars => setVariables(vars)) },
    []
  )
  const hidden = {
    contact: ['accessGroup', 'site', 'dateScreening'],
    baseline: [
      'dateScreening', 'email', 'mobile', 'redcapRecordId', 'accessGroup',
      'site'
    ],
    schedule: [
      'email', 'mobile', 'redcapRecordId', 'accessGroup', 'site'
    ],
    weeklysurvey: [
      'email', 'mobile', 'redcapRecordId', 'accessGroup', 'site'
    ]
  }
  return <Layout
    user={user}
    active="tables"
  >
    <Head>
      <title>{toTitleCase(table)} - HCW flu study</title>
      <meta
        name="Description"
        content={`${toTitleCase(table)} - HCW flu study`}
      />
    </Head>
    <SubnavbarTables
      user={user}
      active={table}
      tables={Object.keys(hidden)}
    />
    {
      Object.keys(hidden).includes(table) && <TablePage
        user = {user}
        tableName = {table}
        variables = {variables}
        hidden = {hidden[table]}
      />
    }
  </Layout>
}

// I need this here, otherwise the query will not be inserted into the
// router object quickly enough, and it will look like the link does not
// provide any credentials which will cause `useUser` to redirect to `getlink`
export async function getServerSideProps (_) { return { props: {} } }
