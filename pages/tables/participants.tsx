import Head from 'next/head'
import Layout from '../../components/layout'
import { authorise } from '../../lib/authorise'
import Table from '../../components/table'
import { SubnavbarTables } from '../../components/navbar'

import useSWR from 'swr'

async function fetchOwnApi (id, token, which) {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')
  myHeaders.append('Accept', 'application/json')
  const res = await fetch(
    `/api/get${which}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: new URLSearchParams({ id: id, token: token }).toString()
    }
  )
  return await res.json()
}

export default function ParticipantTable (
  props: {authorised: boolean, id: number, token: string}
) {
  const { data, error } = useSWR(
    [props.id, props.token, 'participants'], fetchOwnApi
  )
  if (error) {
    console.error(error)
  }
  let jsonrows
  if (!props.authorised) {
    jsonrows = []
  } else if (!data) {
    jsonrows = null
  } else {
    jsonrows = data
  }
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
        jsonrows={jsonrows}
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
