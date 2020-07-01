import Head from 'next/head'
import { useState } from 'react'
import { accessAPI } from '../../lib/util'
import { newconfig } from '../../lib/config'
import db from '../../lib/db'
import TablePage from '../../components/tablePage'
import Layout from '../../components/layout'
import { SubnavbarTables } from '../../components/navbar'
import { useRouter } from 'next/router'

/* eslint-disable react/prop-types, react/jsx-key */

function toTitleCase (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function ParticipantTable (
  { user, variables }
) {
  const router = useRouter()
  const { table } = router.query
  const [accessGroup, setAccessGroup] = useState(user.accessGroup)
  const [jsonrows, setData] = useState([])
  async function updateData (newAccessGroup) {
    setData(await accessAPI(
      'getparticipants', 'GET',
      {
        email: user.email,
        token: user.token,
        subset: table,
        accessGroup: newAccessGroup || accessGroup
      }
    ))
  }
  const hidden = {
    contact: ['accessGroup', 'site', 'dateScreening'],
    baseline: [
      'dateScreening', 'email', 'mobile', 'redcapRecordId', 'accessGroup',
      'site'
    ]
  }
  // @PROBLEM
  // Data race? `updateData` is passed on to other components and thus
  // may be called before the current `accessGroup`
  // state changes thus resulting in an update with previous state
  return <Layout
    user={user}
    active="tables"
    onSiteChange={(event) => {
      setAccessGroup(event.target.value)
      updateData(event.target.value)
    }}
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
    />
    {
      ['contact', 'baseline'].includes(table)
        ? <TablePage
          jsonrows = {jsonrows}
          updateData = {updateData}
          authorised = {user.authorised}
          email = {user.email}
          token = {user.token}
          variables = {variables}
          hidden = {hidden[table]}
        />
        : <p>No such table</p>
    }
  </Layout>
}

export async function getServerSideProps (context) {
  return {
    props: {
      user: {
        authorised: await db.authoriseUser(
          context.query.email, context.query.token
        ),
        email: context.query.email || null,
        token: context.query.token || null,
        accessGroup: await db.getUserAccessGroup(context.query.email)
      },
      variables: newconfig.db.variables.Participant
    }
  }
}
