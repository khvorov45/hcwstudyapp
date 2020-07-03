import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/layout'
import { fetchParticipantData } from '../lib/util'
import Ribbon from '../components/ribbon'
import Plotlist, { AgeHistogram, GenderBar, PrevVacBar }
  from '../components/plot'
import { useUser } from '../lib/hooks'

export default function Plots () {
  const user = useUser()
  const [data, setData] = useState([])
  const [accessGroup, setAccessGroup] = useState(user.accessGroup)
  async function updateData () {
    if (!user.authorised) return
    setData(await fetchParticipantData(user, 'baseline', accessGroup))
  }
  useEffect(() => { updateData() }, [accessGroup])
  if (!user.authorised) return <></>
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
        <PrevVacBar data={data} />
      </Plotlist>
    </Layout>
  )
}
