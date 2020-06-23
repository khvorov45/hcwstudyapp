import Head from 'next/head'
import { useState } from 'react'
import Layout from '../../components/layout'
import { authorise } from '../../lib/authorise'
import Table from '../../components/table'
import { SubnavbarTables } from '../../components/navbar'
import { fetchOwnApi } from '../../lib/util'
import Ribbon from '../../components/ribbon'
import config from '../../lib/config'

export default function ParticipantTable (
  props: {authorised: boolean, email: string, token: string, variables: any}
) {
  const [jsonrows, setData] = useState([])
  async function updateData () {
    setData(await fetchOwnApi(props.email, props.token, 'getparticipants'))
  }
  return (
    <Layout
      authorised={props.authorised}
      email={props.email}
      token={props.token}
      active="tables"
    >
      <Head>
        <title>Participants - HCW flu study</title>
        <meta name="Description" content="Participants - HCW flu study" />
      </Head>
      <SubnavbarTables
        authorised={props.authorised}
        email={props.email}
        token={props.token}
        active = "participants"
      />
      <Ribbon
        email={props.email}
        token={props.token}
        afterdbUpdate={updateData}
      />
      <Table
        jsonrows={jsonrows}
        variables={props.variables}
      />
    </Layout>
  )
}

export async function getServerSideProps (context) {
  return {
    props: {
      authorised: await authorise(context.query.email, context.query.token),
      email: context.query.email || null,
      token: context.query.token || null,
      variables: (await config.variables)
        .filter(v => v.table === 'Participant')
    }
  }
}
