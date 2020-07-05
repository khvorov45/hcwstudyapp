import Layout from '../components/layout'
import Head from 'next/head'
import { useUser } from '../lib/hooks'

export default function Home (
) {
  const user = useUser()
  return (
    <Layout
      user={user}
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
