import { useState } from 'react'
import Head from 'next/head'
import { bin } from 'd3-array'
import {
  BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar
} from 'recharts'
import Layout from '../components/layout'
import db from '../lib/db'
import { accessAPI } from '../lib/util'
import Ribbon from '../components/ribbon'

function Histogram ({ data, x }: {data: any, x: string}) {
  const xvec = data.map(row => row[x])
  const histData = bin()(xvec).reduce(
    (acc, el) => {
      acc.push({ x: (el.x0 + el.x1) / 2, y: el.length })
      return acc
    },
    []
  )
  console.log(histData)
  return <BarChart width={730} height={250} data={histData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="x" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="y" fill="#8884d8" />
  </BarChart>
}

export default function Plots (
  { authorised, email, token } :
  {authorised: boolean, email: string, token: string}
) {
  const [data, setData] = useState([])
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
      <Histogram data={data} x='age'/>
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
