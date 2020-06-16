import Layout from '../components/layout'
import Head from 'next/head'
import { authorise } from '../lib/authorise'

export default function Plots (
  props: {authorised: boolean, id: number, token: string}
) {
  return (
    <Layout
      id={props.id}
      token={props.token}
      authorised={props.authorised}
      active="plots"
    >
      <Head>
        <title>Plots - HCW flu study</title>
        <meta name="Description" content="Plots - HCW flu study" />
      </Head>
      <p>Plots here</p>
    </Layout>
  )
}

export async function getServerSideProps (context) {
  return {
    props: {
      authorised: await authorise(+context.query.id, context.query.token),
      id: +context.query.id || null,
      token: context.query.token || null
    }
  }
}
