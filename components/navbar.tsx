import { ReactNode } from 'react'
import { ThemeSwitch } from './theme'
import styles from './navbar.module.css'

export default function Navbar (
  { authorised, constQuery, active }:
  {authorised: boolean, constQuery: string, active: string}
) {
  var otherNavElements = <></>
  if (authorised) {
    otherNavElements = <>
      <Navelement
        content="Tables"
        link={`/tables/participants${constQuery}`}
        active={active === 'tables'}
      />
      <Navelement
        content="Plots"
        link={`/plots${constQuery}`}
        active={active === 'plots'}
      />
    </>
  }
  return <nav className={styles.container}>
    <Navelement
      content="Help"
      link={`/${constQuery}`}
      active={active === 'home'}
    />
    {otherNavElements}
    <ThemeSwitch />
  </nav>
}

export function Navelement (
  { content, link, active }: {content: string, link: string, active: boolean}
) {
  return <li className={styles.element}>
    <a
      href={link}
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
  { authorised, constQuery, active }:
  {authorised: boolean, constQuery: string, active: string}
) {
  return <Subnavbar authorised={authorised}>
    <Navelement
      content="Participants"
      link={`/tables/participants${constQuery}`}
      active={active === 'participants'}
    />
    <Navelement
      content="Appointments"
      link={`/tables/appointments${constQuery}`}
      active={active === 'appointments'}
    />
  </Subnavbar>
}
