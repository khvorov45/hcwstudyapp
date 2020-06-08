import Layout from '../components/layout'
import InfoMessage from '../components/info'
import EmailForm from '../components/emailform'
import Head from 'next/head'
import { authorise } from '../lib/authorise'

function Noquery (props: {info: string, message: string}) {
  return (
    <>
      <InfoMessage
        content={props.info}
      />
      <EmailForm
        message={props.message}
      />
    </>
  )
}

export default function Home (props: {authorised: boolean}) {
  var PageElement: JSX.Element
  if (props.authorised === null) {
    PageElement = <Noquery
      info="Please use the given link to access reports"
      message="If you don't have a link, enter your email below and a new one
        will be sent to you"
    />
  } else if (props.authorised) {
    PageElement = <p>Authorised</p>
  } else {
    PageElement = <Noquery
      info="Link is not valid"
      message="Enter your email below and a new one
        will be sent to you"
    />
  }
  return (
    <Layout>
      <Head>
        <title>HCW flu study reports</title>
        <meta name="Description" content="Reports for the HCW flu study" />
      </Head>
      {PageElement}
    </Layout>
  )
}

export async function getServerSideProps (context) {
  return {
    props: {
      authorised: await authorise(+context.query.id, context.query.token)
    }
  }
}
