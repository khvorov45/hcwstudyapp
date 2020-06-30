import { ReactNode } from 'react'
import styles from './navbar.module.css'
import { getConstQuery, User } from '../lib/util'

export default function Navbar (
  { user, active }:
  {user: User, active: string}
) {
  var otherNavElements = <></>
  if (user.authorised) {
    otherNavElements = <>
      <Navelement
        content="Tables"
        link={'/tables/contact'}
        email={user.email}
        token={user.token}
        active={active === 'tables'}
      />
      <Navelement
        content="Plots"
        link={'/plots'}
        email={user.email}
        token={user.token}
        active={active === 'plots'}
      />
    </>
  }
  return <nav className={styles.container}>
    <Navelement
      content="Help"
      link={'/'}
      email={user.email}
      token={user.token}
      active={active === 'home'}
    />
    {otherNavElements}
    <Siteswitch accessGroup={user.accessGroup} />
    <ThemeSwitch />
  </nav>
}

export function Navelement (
  { content, link, email, token, active }:
  {content: string, link: string, email: string, token: string, active: boolean}
) {
  return <li>
    <a
      href={`${link}${getConstQuery(email, token)}`}
      className={styles.link}
    >
      <div className={
        active ? `${styles.element} ${styles.active}` : styles.element
      }>
        {content}
      </div>
    </a>
  </li>
}

export function Subnavbar (
  { children, authorised }:
  {children: ReactNode, authorised: boolean}
) {
  if (!authorised) return <></>
  return <nav className={styles.container}>
    {children}
  </nav>
}

export function SubnavbarTables (
  { authorised, email, token, active }:
  {authorised: boolean, email: string, token: string, active: string}
) {
  return <Subnavbar authorised={authorised}>
    <Navelement
      content="Contact"
      link={'/tables/contact'}
      email={email}
      token={token}
      active={active === 'contact'}
    />
    <Navelement
      content="Baseline"
      link={'/tables/baseline'}
      email={email}
      token={token}
      active={active === 'baseline'}
    />
  </Subnavbar>
}

function ThemeSwitch () {
  function changeTheme () {
    let theme: string
    if (document.documentElement.getAttribute('theme') === 'dark') {
      theme = 'light'
    } else {
      theme = 'dark'
    }
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('theme', theme)
  }
  return (
    <i
      className={`${styles.themeswitch} material-icons`}
      onClick={changeTheme}
    >
      invert_colors
    </i>
  )
}

export function Siteswitch ({ accessGroup }: {accessGroup: string}) {
  const theswitch = <div className={styles.siteswitch}>
    Siteswitch
  </div>
  return (['unrestricted', 'admin'].includes(accessGroup)) ? theswitch : <></>
}
