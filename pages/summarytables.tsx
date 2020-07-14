import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/layout'
import { accessAPI } from '../lib/util'
import Ribbon from '../components/ribbon'
import { useUser } from '../lib/hooks'
import SummaryTable from '../components/summaryTable'

export default function SummaryTables () {
  const user = useUser()
  const [data, setData] = useState([])
  const [accessGroup, setAccessGroup] = useState(user.accessGroup)
  useEffect(() => { setAccessGroup(user.accessGroup) }, [user])
  const [withdrawn, setWithdrawn] = useState('no')
  async function updateData () {
    if (!user.authorised) return
    const fetchedData = await accessAPI(
      'getsummary', 'GET',
      {
        email: user.email,
        token: user.token,
        withdrawn: withdrawn,
        accessGroup: accessGroup
      }

    )
    setData(fetchedData)
  }
  useEffect(() => { updateData() }, [accessGroup, withdrawn])
  return (
    <Layout
      user={user}
      active="summarytables"
    >
      <Head>
        <title>Summary Tables - HCW flu study</title>
        <meta name="Description" content="Summary tables - HCW flu study" />
      </Head>
      <Ribbon
        user={user}
        updateDBPromiseArea="updatedb"
        afterdbUpdate={updateData}
        onAccessGroupChange={(value) => { setAccessGroup(value) }}
        elements={{
          filters: [
            {
              id: 'withdrawn',
              label: 'Withdrawn',
              defaultValue: withdrawn,
              fun: (newValue: string) => { setWithdrawn(newValue) }
            }
          ]
        }}
      />
      <SummaryTable jsonrows={data} />
    </Layout>
  )
}
