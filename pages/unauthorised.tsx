import Head from 'next/head'
import InfoMessage from '../components/info'
import EmailForm from '../components/emailform'

export default function Unauthorised () {
  return <>
    <Head>
      <title>HCW flu study reports - unautorised</title>
      <meta
        name="Description"
        content="Reports for the HCW flu study - unautorised access"
      />
    </Head>
    <InfoMessage
      content="Link is not valid"
    />
    <EmailForm
      message="Enter your email below and a new one
      will be sent to you"
    />
  </>
}
