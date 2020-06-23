import Head from 'next/head'
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'
import Layout from '../components/layout'
import { authorise } from '../lib/authorise'

export default function Plots (
  props: {authorised: boolean, email: string, token: string}
) {
  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 500, pv: 2400, amt: 2400 }
  ]
  return (
    <Layout
      authorised={props.authorised}
      email={props.email}
      token={props.token}
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
      authorised: await authorise(context.query.email, context.query.token),
      email: context.query.email || null,
      token: context.query.token || null
    }
  }
}
