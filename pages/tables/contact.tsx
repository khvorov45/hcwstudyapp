import Head from 'next/head'
import { useState } from 'react'
import Layout from '../../components/layout'
import Table from '../../components/table'
import { SubnavbarTables } from '../../components/navbar'
import { accessAPI } from '../../lib/util'
import Ribbon from '../../components/ribbon'
import { newconfig } from '../../lib/config'
import db from '../../lib/db'

export default function ParticipantTable (
  props: {authorised: boolean, email: string, token: string, variables: any}
) {
  const [jsonrows, setData] = useState([])
  async function updateData () {
    setData(await accessAPI(
      'getparticipants', 'GET',
      { email: props.email, token: props.token }
    ))
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
        <meta name="Description" content="Contact - HCW flu study" />
      </Head>
      <SubnavbarTables
        authorised={props.authorised}
        email={props.email}
        token={props.token}
        active = "contact"
      />
      <Ribbon
        email={props.email}
        token={props.token}
        updateDBPromiseArea="updatedb"
        afterdbUpdate={updateData}
      />
      <Table
        jsonrows={jsonrows}
        variables={props.variables}
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
