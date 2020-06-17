import Head from 'next/head'
import Layout from '../../components/layout'
import { authorise } from '../../lib/authorise'
import Table from '../../components/table'
import { SubnavbarTables } from '../../components/navbar'

export default function ParticipantTable (
  props: {authorised: boolean, id: number, token: string}
) {
  return (
    <Layout
      authorised={props.authorised}
      id={props.id}
      token={props.token}
      active="tables"
    >
      <Head>
        <title>Participants - HCW flu study</title>
        <meta name="Description" content="Participants - HCW flu study" />
      </Head>
      <SubnavbarTables
        authorised={props.authorised}
        id={props.id}
        token={props.token}
        active = "participants"
      />
      <Table
        authorised={props.authorised}
        id={props.id}
        token={props.token}
        name="participants"
      />
    </Layout>
  )
}

export async function getServerSideProps (context) {
  return {
    props: {
      authorised: await authorise(+context.query.id, context.query.token),
      id: +context.query.id || null,
      token: context.query.token || null
    }
  }
}
