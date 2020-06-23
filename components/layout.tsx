import Head from 'next/head'
import Navbar from './navbar'
import InfoMessage from './info'
import EmailForm from './emailform'

function EmptyCred () {
  return <>
    <Head>
      <title>HCW flu study reports</title>
      <meta name="Description" content="Reports for the HCW flu study" />
    </Head>
    <InfoMessage
      content="Please use the given link to access reports"
    />
    <EmailForm
      message="If you don't have a link, enter your email below and a new one
        will be sent to you"
    />
  </>
}

function Unauthorised () {
  return <>
    <Head>
      <title>HCW flu study reports - unautorised</title>
      <meta
        name="Description"
        content="Reports for the HCW flu study - unautorised access"
      />
    </Head>
    <InfoMessage
      content="Link is not valemail"
    />
    <EmailForm
      message="Enter your email below and a new one
      will be sent to you"
    />
  </>
}

export default function Layout (
  props: {
    children: React.ReactNode,
    authorised: boolean,
    email: string,
    token: string,
    active: string,
  }
) {
  var pageContent = props.children
  if (props.authorised === null) {
    pageContent = EmptyCred()
  } else if (!props.authorised) {
    pageContent = Unauthorised()
  }
  return (
    <>
      <Navbar
        authorised={props.authorised}
        email={props.email}
        token={props.token}
        active={props.active}
      />
      <main>{pageContent}</main>
    </>
  )
}
