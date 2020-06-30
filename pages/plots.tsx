import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/layout'
import db from '../lib/db'
import { accessAPI, User } from '../lib/util'
import Ribbon from '../components/ribbon'
import Plotlist, { Histogram } from '../components/plot'

export default function Plots (
  { authorised, user } :
  {authorised: boolean, user: User}
) {
  const [data, setData] = useState([])
  async function updateData () {
    setData(await accessAPI(
      'getparticipants', 'GET',
      { email: user.email, token: user.token, subset: 'baseline' }
    ))
  }
  return (
    <Layout
      authorised={authorised}
      email={user.email}
      token={user.token}
      active="plots"
    >
      <Head>
        <title>Plots - HCW flu study</title>
        <meta name="Description" content="Plots - HCW flu study" />
      </Head>
      <Ribbon
        email={user.email}
        token={user.token}
        updateDBPromiseArea="updatedb"
        afterdbUpdate={updateData}
        elements={{}}
      />
      <Plotlist>
        <Histogram data={data} x='age'/>
      </Plotlist>
    </Layout>
  )
}

export async function getServerSideProps (context) {
  return {
    props: {
      authorised: await db.authoriseUser(
        context.query.email, context.query.token
      ),
      user: {
        email: context.query.email || null,
        token: context.query.token || null
      }
    }
  }
}
