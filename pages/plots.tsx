import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/layout'
import db from '../lib/db'
import { fetchParticipantData, User } from '../lib/util'
import Ribbon from '../components/ribbon'
import Plotlist, { AgeHistogram, GenderBar } from '../components/plot'

export default function Plots (
  { user } :
  {user: User}
) {
  const [data, setData] = useState([])
  const [accessGroup, setAccessGroup] = useState(user.accessGroup)
  async function updateData () {
    setData(await fetchParticipantData(user, 'baseline', accessGroup))
  }
  useEffect(() => { updateData() }, [accessGroup])
  return (
    <Layout
      user={user}
      active="plots"
    >
      <Head>
        <title>Plots - HCW flu study</title>
        <meta name="Description" content="Plots - HCW flu study" />
      </Head>
      <Ribbon
        user={user}
        updateDBPromiseArea="updatedb"
        afterdbUpdate={updateData}
        onAccessGroupChange={(value) => { setAccessGroup(value) }}
        elements={{}}
      />
      <Plotlist>
        <AgeHistogram data={data} />
        <GenderBar data={data} />
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
