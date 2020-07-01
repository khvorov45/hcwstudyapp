import Layout from '../components/layout'
import Head from 'next/head'
import db from '../lib/db'
import { User } from '../lib/util'

export default function Home (
  { user }: { user: User}
) {
  // @REVIEW
  // Remove sitechanging from index?
  return (
    <Layout
      user={user}
      active="home"
      onSiteChange={() => {}}
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
        token: context.query.token || null,
        accessGroup: await db.getUserAccessGroup(context.query.email)
      }
    }
  }
}
