import { ThemeSwitch } from './theme'
import InfoMessage from './info'
import EmailForm from './emailform'
import Head from 'next/head'
import navstyle from './navbar.module.css'

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

function Navelement (
  { content, link, active }: {content: string, link: string, active: boolean}
) {
  return <li className={navstyle.element}>
    <a
      href={link}
      className={
        active ? `${navstyle.link} ${navstyle.active}` : navstyle.link}
    >
      {content}
    </a>
  </li>
}

function Navbar (
  { authorised, constQuery, active }:
  {authorised: boolean, constQuery: string, active: string}
) {
  var otherNavElements = <></>
  if (authorised) {
    otherNavElements = <>
      <Navelement
        content="Tables"
        link={`/rawtables${constQuery}`}
        active={active === 'tables'}
      />
    </>
  }
  return <nav className={navstyle.container}>
    <Navelement
      content="Help"
      link={`/${constQuery}`}
      active={active === 'home'}
    />
    {otherNavElements}
    <ThemeSwitch />
  </nav>
}

function EmptyCred () {
  return <>
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
    <Noquery
      info="Link is not valid"
      message="Enter your email below and a new one
  will be sent to you"
    />
  </>
}

export default function Layout (
  props: {
    children: React.ReactNode,
    id: number,
    token: string,
    authorised: boolean,
    active: string,
  }
) {
  var constQuery = ''
  if (props.id && props.token) {
    constQuery = `?id=${props.id}&token=${props.token}`
  }

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
        constQuery={constQuery}
        active={props.active}
      />
      <main>{pageContent}</main>
    </>
  )
}
