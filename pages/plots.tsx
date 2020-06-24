import Head from 'next/head'
import Layout from '../components/layout'
import { authorise } from '../lib/authorise'

export default function Plots (
  props: {authorised: boolean, email: string, token: string}
) {
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
      Plot here
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
