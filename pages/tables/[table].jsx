import Head from 'next/head'
import { toTitleCase } from '../../lib/util'
import { newconfig } from '../../lib/config'
import TablePage from '../../components/tablePage'
import Layout from '../../components/layout'
import { SubnavbarTables } from '../../components/navbar'
import { useRouter } from 'next/router'
import { useUser } from '../../lib/hooks'

/* eslint-disable react/prop-types, react/jsx-key */

export default function ParticipantTable (
  { variables }
) {
  const user = useUser()
  const router = useRouter()
  const { table } = router.query
  const hidden = {
    contact: ['accessGroup', 'site', 'dateScreening'],
    baseline: [
      'dateScreening', 'email', 'mobile', 'redcapRecordId', 'accessGroup',
      'site'
    ]
  }
  if (!user.authorised) return <></>
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
    />
    {
      ['contact', 'baseline'].includes(table)
        ? <TablePage
          user = {user}
          tableName = {table}
          variables = {variables}
          hidden = {hidden[table]}
        />
        : <p>No such table</p>
    }
  </Layout>
}

export async function getServerSideProps (_) {
  return {
    props: {
      variables: newconfig.db.variables.Participant
    }
  }
}
