import Layout from '../components/layout'
import InfoMessage from '../components/info'
import { authorise } from '../lib/authorise'

export default function Home (props: {authorised: boolean}) {
  return (
    <Layout>
      {
        props.authorised
          ? <InfoMessage content="Supposed to show reports" />
          : <InfoMessage
            content="Please use the given link to access reports"
          />
      }
    </Layout>
  )
}

export async function getServerSideProps (context) {
  return {
    props: {
      authorised: await authorise(context.query.site, context.query.token)
    }
  }
}
