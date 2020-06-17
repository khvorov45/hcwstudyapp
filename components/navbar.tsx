import { ReactNode } from 'react'
import { ThemeSwitch } from './theme'
import styles from './navbar.module.css'
import { getConstQuery } from '../lib/util'

export default function Navbar (
  { authorised, id, token, active }:
  {authorised: boolean, id: number, token: string, active: string}
) {
  var otherNavElements = <></>
  if (authorised) {
    otherNavElements = <>
      <Navelement
        content="Tables"
        link={'/tables/participants'}
        id={id}
        token={token}
        active={active === 'tables'}
      />
      <Navelement
        content="Plots"
        link={'/plots'}
        id={id}
        token={token}
        active={active === 'plots'}
      />
    </>
  }
  return <nav className={styles.container}>
    <Navelement
      content="Help"
      link={'/'}
      id={id}
      token={token}
      active={active === 'home'}
    />
    {otherNavElements}
    <ThemeSwitch />
  </nav>
}

export function Navelement (
  { content, link, id, token, active }:
  {content: string, link: string, id: number, token: string, active: boolean}
) {
  return <li className={styles.element}>
    <a
      href={`${link}${getConstQuery(id, token)}`}
      className={
        active ? `${styles.link} ${styles.active}` : styles.link
      }
    >
      {content}
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
  { authorised, id, token, active }:
  {authorised: boolean, id: number, token: string, active: string}
) {
  return <Subnavbar authorised={authorised}>
    <Navelement
      content="Participants"
      link={'/tables/participants'}
      id={id}
      token={token}
      active={active === 'participants'}
    />
    <Navelement
      content="Appointments"
      link={'/tables/appointments'}
      id={id}
      token={token}
      active={active === 'appointments'}
    />
  </Subnavbar>
}
