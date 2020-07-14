import Layout from '../components/layout'
import Head from 'next/head'
import { useUser } from '../lib/hooks'
import ReactMarkdown from 'react-markdown'
import { readFileSync } from 'fs'
import path from 'path'

export default function Home (
  { content }: {content: string}
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
      {user.authorised && <ReactMarkdown source={content} />}
    </Layout>
  )
}

export async function getStaticProps () {
  const content = readFileSync(
    path.join(process.cwd(), 'markdown', 'index.md'), 'utf-8'
  )
  return {
    props: {
      content: content
    }
  }
}
