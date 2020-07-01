import { ReactNode } from 'react'
import styles from './navbar.module.css'
import { getConstQuery, User } from '../lib/util'
import { Select } from './input'

export default function Navbar (
  { user, active, onSiteChange }:
  {user: User, active: string, onSiteChange: (event) => void}
) {
  return <nav className={styles.container}>
    <div className={styles.leftside}>
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
    </div>
    <div className={styles.rightside}>
      <Siteswitch accessGroup={user.accessGroup} onChange={onSiteChange} />
      <ThemeSwitch />
    </div>
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
  return <nav className={`${styles.container} ${styles.subcontainer}`}>
    <div className={styles.leftside}>
      {children}
    </div>
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

export function Siteswitch (
  { accessGroup, onChange }: {accessGroup: string, onChange: (event) => void}
) {
  if (!['unrestricted', 'admin'].includes(accessGroup)) {
    return <></>
  }
  return <form className={styles.siteswitch}>
    <Select
      options={[
        'unrestricted', 'adelaide', 'brisbane', 'melbourne', 'newcastle',
        'perth', 'sydney'
      ]}
      onChange={onChange}
    />
  </form>
}
