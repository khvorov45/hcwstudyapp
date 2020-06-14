import Layout from '../components/layout'
import Head from 'next/head'
import { authorise } from '../lib/authorise'

export default function Home (
  props: {authorised: boolean, id: number, token: string}
) {
  return (
    <Layout
      id={props.id}
      token={props.token}
      authorised={props.authorised}
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
      authorised: await authorise(+context.query.id, context.query.token),
      id: +context.query.id || null,
      token: context.query.token || null
    }
  }
}
