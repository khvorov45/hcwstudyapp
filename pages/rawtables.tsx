import Layout from '../components/layout'
import Head from 'next/head'
import { authorise } from '../lib/authorise'
import db from '../lib/db'
import Table from '../components/table'

export default function RawTables (
  props: {authorised: boolean, id: number, token: string,
    participantTable: Object[]}
) {
  return (
    <Layout
      id={props.id}
      token={props.token}
      authorised={props.authorised}
      active="tables"
    >
      <Head>
        <title>HCW flu study tables</title>
        <meta name="Description" content="HCW flu study raw tables" />
      </Head>
      <Table jsonRows = {props.participantTable} />
    </Layout>
  )
}

export async function getServerSideProps (context) {
  const accessGroup = (await (await db).getUser(+context.query.id)).accessGroup
  return {
    props: {
      authorised: await authorise(+context.query.id, context.query.token),
      id: +context.query.id || null,
      token: context.query.token || null,
      participantTable: await (await db).getParticipants(accessGroup)
    }
  }
}
