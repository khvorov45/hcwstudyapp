import Layout from '../components/layout'
import Head from 'next/head'
import db from '../lib/db'
import { User } from '../lib/util'

export default function Home (
  { user }: { user: User}
) {
  return (
    <Layout
      authorised={user.authorised}
      email={user.email}
      token={user.token}
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
      user: {
        authorised: await db.authoriseUser(
          context.query.email, context.query.token
        ),
        email: context.query.email || null,
        token: context.query.token || null
      }
    }
  }
}
