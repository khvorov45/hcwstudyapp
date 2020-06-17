import Head from 'next/head'
import Layout from '../../components/layout'
import { authorise } from '../../lib/authorise'
import db from '../../lib/db'
import Table from '../../components/table'
import { SubnavbarTables } from '../../components/navbar'
import { getConstQuery } from '../../lib/util'

export default function ParticipantTable (
  props: {authorised: boolean, constQuery: string,
    participantTable: Object[]}
) {
  return (
    <Layout
      constQuery={props.constQuery}
      authorised={props.authorised}
      active="tables"
    >
      <Head>
        <title>Participants - HCW flu study</title>
        <meta name="Description" content="HCW flu study raw tables" />
      </Head>
      <SubnavbarTables
        authorised={props.authorised}
        constQuery={props.constQuery}
        active = "participants"
      />
      <Table jsonRows = {props.participantTable} />
    </Layout>
  )
}

export async function getServerSideProps (context) {
  const accessGroup = (await (await db).getUser(+context.query.id)).accessGroup
  return {
    props: {
      authorised: await authorise(+context.query.id, context.query.token),
      constQuery: getConstQuery(context.query),
      participantTable: await (await db).getParticipants(accessGroup)
    }
  }
}
