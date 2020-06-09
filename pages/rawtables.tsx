import Layout from '../components/layout'
import Head from 'next/head'
import { authorise } from '../lib/authorise'
import { getRedcapData } from '../lib/redcap'

export default function RawTables (
  props: {authorised: boolean, id: number, token: string}
) {
  return (
    <Layout id={props.id} token={props.token} authorised={props.authorised}>
      <Head>
        <title>HCW flu study tables</title>
        <meta name="Description" content="HCW flu study raw tables" />
      </Head>
      <p>Supposed to show tables</p>
    </Layout>
  )
}

export async function getServerSideProps (context) {
  getRedcapData()
  return {
    props: {
      authorised: await authorise(+context.query.id, context.query.token),
      id: +context.query.id || null,
      token: context.query.token || null
    }
  }
}
