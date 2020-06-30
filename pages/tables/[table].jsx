import Head from 'next/head'
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
  async function getData () {
    return await accessAPI(
      'getparticipants', 'GET',
      { email: user.email, token: user.token, subset: table }
    )
  }
  const hidden = {
    contact: ['accessGroup', 'site', 'dateScreening'],
    baseline: [
      'dateScreening', 'email', 'mobile', 'redcapRecordId', 'accessGroup',
      'site'
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
      authorised={user.authorised}
      email={user.email}
      token={user.token}
      active={table}
    />
    {
      ['contact', 'baseline'].includes(table)
        ? <TablePage
          getData = {getData}
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
