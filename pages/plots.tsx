import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/layout'
import db from '../lib/db'
import { accessAPI } from '../lib/util'
import Ribbon from '../components/ribbon'

export default function Plots (
  { authorised, email, token } :
  {authorised: boolean, email: string, token: string}
) {
  const [_data, setData] = useState([])
  async function updateData () {
    setData(await accessAPI(
      'getparticipants', 'GET',
      { email: email, token: token, subset: 'baseline' }
    ))
  }
  return (
    <Layout
      authorised={authorised}
      email={email}
      token={token}
      active="plots"
    >
      <Head>
        <title>Plots - HCW flu study</title>
        <meta name="Description" content="Plots - HCW flu study" />
      </Head>
      <Ribbon
        email={email}
        token={token}
        updateDBPromiseArea="updatedb"
        afterdbUpdate={updateData}
        elements={{}}
      />
      Plot here
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
      token: context.query.token || null
    }
  }
}
