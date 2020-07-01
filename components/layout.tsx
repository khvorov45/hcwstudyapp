import Head from 'next/head'
import Navbar from './navbar'
import InfoMessage from './info'
import EmailForm from './emailform'
import { User } from '../lib/util'

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
      content="Link is not valid"
    />
    <EmailForm
      message="Enter your email below and a new one
      will be sent to you"
    />
  </>
}

export default function Layout (
  { children, user, active, onSiteChange }: {
    children: React.ReactNode,
    user: User,
    active: string,
    onSiteChange: (value, action) => void,
  }
) {
  var pageContent = children
  if (user.authorised === null) {
    pageContent = EmptyCred()
  } else if (!user.authorised) {
    pageContent = Unauthorised()
  }
  return (
    <>
      <Navbar
        user={user}
        active={active}
        onSiteChange={onSiteChange}
      />
      <main>{pageContent}</main>
    </>
  )
}
