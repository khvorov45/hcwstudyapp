import Layout from '../components/layout'
import InfoMessage from '../components/info'
import EmailForm from '../components/emailform'

export default function Home () {
  return (
    <Layout>
      <InfoMessage
        content="Please use the given link to access reports"
      />
      <EmailForm
        message="If you don't have a link, enter your email below and a new one
        will be sent to you"
      />
    </Layout>
  )
}
