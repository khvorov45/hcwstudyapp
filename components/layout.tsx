import { ThemeSwitch } from './theme'
import InfoMessage from '../components/info'
import EmailForm from '../components/emailform'
import Head from 'next/head'

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

export default function Layout (
  props: {
    children: React.ReactNode,
    id: number
    token: string
    authorised: boolean
  }
) {
  var constQuery = ''
  if (props.id && props.token) {
    constQuery = `?id=${props.id}&token=${props.token}`
  }
  var navBarExtra = <a
    href={`/rawtables${constQuery}`}><h2>Raw tables</h2>
  </a>
  var pageContent = props.children
  if (props.authorised === null) {
    navBarExtra = <></>
    pageContent = <>
      <Head>
        <title>HCW flu study reports</title>
        <meta name="Description" content="Reports for the HCW flu study" />
      </Head>
      <Noquery
        info="Please use the given link to access reports"
        message="If you don't have a link, enter your email below and a new one
        will be sent to you"
      />
    </>
  } else if (!props.authorised) {
    navBarExtra = <></>
    pageContent = <>
      <Head>
        <title>HCW flu study reports - unautorised</title>
        <meta
          name="Description"
          content="Reports for the HCW flu study - unautorised access"
        />
      </Head>
      <Noquery
        info="Link is not valid"
        message="Enter your email below and a new one
      will be sent to you"
      />
    </>
  }
  return (
    <>
      <nav>
        <a href={`/${constQuery}`}>
          <h1>Study reports</h1>
        </a>
        {navBarExtra}
        <ThemeSwitch />
      </nav>
      <main>{pageContent}</main>
    </>
  )
}
