import { ReactNode } from 'react'
import styles from './navbar.module.css'
import { getConstQuery, User } from '../lib/util'

export default function Navbar (
  { user, active }:
  {user: User, active: string}
) {
  return <nav className={styles.container}>
    <Navelement
      content="Help"
      link={'/'}
      user={user}
      authorisedOnly={false}
      active={active === 'home'}
    />
    <Navelement
      content="Tables"
      link={'/tables/contact'}
      user={user}
      authorisedOnly={true}
      active={active === 'tables'}
    />
    <Navelement
      content="Plots"
      link={'/plots'}
      user={user}
      authorisedOnly={true}
      active={active === 'plots'}
    />
    <Siteswitch accessGroup={user.accessGroup} />
    <ThemeSwitch />
  </nav>
}

export function Navelement (
  { content, link, user, active, authorisedOnly }:
  {
    content: string, link: string, user: User,
    active: boolean, authorisedOnly: boolean
  }
) {
  if (authorisedOnly && user.authorised !== true) {
    return <></>
  }
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
  { children }:
  {children: ReactNode}
) {
  return <nav className={styles.container}>
    {children}
  </nav>
}

export function SubnavbarTables (
  { user, active }:
  {user: User, active: string}
) {
  return <Subnavbar>
    <Navelement
      content="Contact"
      link={'/tables/contact'}
      user={user}
      authorisedOnly={true}
      active={active === 'contact'}
    />
    <Navelement
      content="Baseline"
      link={'/tables/baseline'}
      user={user}
      authorisedOnly={true}
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
  if (['unrestricted', 'admin'].includes(accessGroup)) {
    return <div className={styles.siteswitch}>
      Siteswitch
    </div>
  }
  return <></>
}
