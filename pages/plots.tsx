import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/layout'
import db from '../lib/db'
import { accessAPI, User } from '../lib/util'
import Ribbon from '../components/ribbon'
import Plotlist, { Histogram } from '../components/plot'

export default function Plots (
  { user } :
  {user: User}
) {
  const [data, setData] = useState([])
  const [accessGroup, setAccessGroup] = useState(user.accessGroup)
  async function updateData (newAccessGroup) {
    setData(await accessAPI(
      'getparticipants', 'GET',
      {
        email: user.email,
        token: user.token,
        subset: 'baseline',
        accessGroup: newAccessGroup || accessGroup
      }
    ))
  }
  // @REVIEW
  // Repeating a lot of code from [table]
  return (
    <Layout
      user={user}
      active="plots"
      onSiteChange={(event) => {
        setAccessGroup(event.target.value)
        updateData(event.target.value)
      }}
    >
      <Head>
        <title>Plots - HCW flu study</title>
        <meta name="Description" content="Plots - HCW flu study" />
      </Head>
      <Ribbon
        email={user.email}
        token={user.token}
        updateDBPromiseArea="updatedb"
        afterdbUpdate={() => updateData(accessGroup)}
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
      user: {
        authorised: await db.authoriseUser(
          context.query.email, context.query.token
        ),
        email: context.query.email || null,
        token: context.query.token || null,
        accessGroup: await db.getUserAccessGroup(context.query.email)
      }
    }
  }
}
