import Head from 'next/head'
import { accessAPI } from '../../lib/util'
import { newconfig } from '../../lib/config'
import db from '../../lib/db'
import TablePage from '../../components/tablePage'
import Layout from '../../components/layout'
import { SubnavbarTables } from '../../components/navbar'

/* eslint-disable react/prop-types, react/jsx-key */

export default function ParticipantTable (
  { authorised, email, token, variables }
) {
  async function getData () {
    return await accessAPI(
      'getparticipants', 'GET',
      { email: email, token: token, subset: 'contact' }
    )
  }
  return <Layout
    authorised={authorised}
    email={email}
    token={token}
    active="tables"
  >
    <Head>
      <title>Participants - HCW flu study</title>
      <meta name="Description" content="Contact - HCW flu study" />
    </Head>
    <SubnavbarTables
      authorised={authorised}
      email={email}
      token={token}
      active = "contact"
    />
    <TablePage
      getData = {getData}
      authorised = {authorised}
      email = {email}
      token = {token}
      variables = {variables}
    />
  </Layout>
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
