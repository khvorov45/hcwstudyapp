import Head from 'next/head'
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'
import Layout from '../components/layout'
import { authorise } from '../lib/authorise'
import { getConstQuery } from '../lib/util'

export default function Plots (
  props: {authorised: boolean, constQuery: string}
) {
  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 500, pv: 2400, amt: 2400 }
  ]
  return (
    <Layout
      constQuery={props.constQuery}
      authorised={props.authorised}
      active="plots"
    >
      <Head>
        <title>Plots - HCW flu study</title>
        <meta name="Description" content="Plots - HCW flu study" />
      </Head>
      <LineChart width={400} height={400} data={data}>
        <Line type="monotone" dataKey="uv" stroke="#8884d8" />
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="name" />
        <YAxis />
      </LineChart>
    </Layout>
  )
}

export async function getServerSideProps (context) {
  return {
    props: {
      authorised: await authorise(+context.query.id, context.query.token),
      constQuery: getConstQuery(context.query)
    }
  }
}
