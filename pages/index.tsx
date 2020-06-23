import Layout from '../components/layout'
import Head from 'next/head'
import { authorise } from '../lib/authorise'

export default function Home (
  props: {authorised: boolean, email: string, token: string}
) {
  return (
    <Layout
      authorised={props.authorised}
      email={props.email}
      token={props.token}
      active="home"
    >
      <Head>
        <title>HCW flu study reports</title>
        <meta name="Description" content="Reports for the HCW flu study" />
      </Head>
      <p>Authorised</p>
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
