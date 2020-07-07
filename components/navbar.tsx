import { ReactNode } from 'react'
import styles from './navbar.module.css'
import { getConstQuery, User } from '../lib/util'

export default function Navbar (
  { user, active }:
  {user: User, active: string}
) {
  return <nav className={styles.container}>
    <div className={styles.leftside}>
      <Navelement
        content="Help"
        link={'/'}
        user={user}
        active={active === 'home'}
      />
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
    </div>
    <div className={styles.rightside}>
      <ThemeSwitch />
    </div>
  </nav>
}

export function Navelement (
  { content, link, user, active }:
  {
    content: string, link: string, user: User,
    active: boolean
  }
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
  { user, active, tables }:
  {user: User, active: string, tables: {id: string, label: string}[]}
) {
  return <Subnavbar>
    {tables.map(tbl => <Navelement
      key={tbl.id}
      content={tbl.label}
      link={'/tables/' + tbl.id}
      user={user}
      active={active === tbl.id}
    />)}
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
