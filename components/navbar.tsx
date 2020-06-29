import { ReactNode } from 'react'
import { ThemeSwitch } from './theme'
import styles from './navbar.module.css'
import { getConstQuery } from '../lib/util'

export default function Navbar (
  { authorised, email, token, active }:
  {authorised: boolean, email: string, token: string, active: string}
) {
  var otherNavElements = <></>
  if (authorised) {
    otherNavElements = <>
      <Navelement
        content="Tables"
        link={'/tables/contact'}
        email={email}
        token={token}
        active={active === 'tables'}
      />
      <Navelement
        content="Plots"
        link={'/plots'}
        email={email}
        token={token}
        active={active === 'plots'}
      />
    </>
  }
  return <nav className={styles.container}>
    <Navelement
      content="Help"
      link={'/'}
      email={email}
      token={token}
      active={active === 'home'}
    />
    {otherNavElements}
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
