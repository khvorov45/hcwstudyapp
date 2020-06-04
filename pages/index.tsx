import Layout from '../components/layout'
import InfoMessage from '../components/info'
import { getPasswords } from '../lib/passwords'

export default function Home (props: {authorised: boolean}) {
  console.log(props)
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
  console.log(context.query)
  console.log(getPasswords())
  return { props: { authorised: false } }
}
