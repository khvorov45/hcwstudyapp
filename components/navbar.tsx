import { ReactNode, useState, useEffect } from 'react'
import { ThemeSwitch } from './theme'
import styles from './navbar.module.css'
import { getConstQuery, accessAPI, User } from '../lib/util'

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
    <Siteswitch email={user.email} token={user.token} />
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

export function Siteswitch ({ email, token }: {email: string, token: string}) {
  console.log(email, token)
  const [accessGroup, setAccessGroup] = useState('')
  async function fetchAccessGroup (email, token) {
    setAccessGroup(await accessAPI(
      'getuseraccessgroup', 'GET', { email: email, token: token }
    ))
  }
  useEffect(() => {
    fetchAccessGroup(email, token)
  }, [])
  console.log(accessGroup)
  return <div>
    {(['unrestricted', 'admin'].includes(accessGroup)) ? 'Siteswitch' : <></>}
  </div>
}
