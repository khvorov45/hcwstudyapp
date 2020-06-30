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
        user={user}
        active={active === 'tables'}
      />
      <Navelement
        content="Plots"
        link={'/plots'}
        user={user}
        active={active === 'plots'}
      />
    </>
  }
  return <nav className={styles.container}>
    <Navelement
      content="Help"
      link={'/'}
      user={user}
      active={active === 'home'}
    />
    {otherNavElements}
    <Siteswitch accessGroup={user.accessGroup} />
    <ThemeSwitch />
  </nav>
}

export function Navelement (
  { content, link, user, active }:
  {content: string, link: string, user: User, active: boolean}
) {
  return <li>
    <a
      href={`${link}${getConstQuery(user.email, user.token)}`}
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
  { user, active }:
  {user: User, active: string}
) {
  return <Subnavbar authorised={user.authorised}>
    <Navelement
      content="Contact"
      link={'/tables/contact'}
      user={user}
      active={active === 'contact'}
    />
    <Navelement
      content="Baseline"
      link={'/tables/baseline'}
      user={user}
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
