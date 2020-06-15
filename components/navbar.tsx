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
        link={`/rawtables${constQuery}`}
        active={active === 'tables'}
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

function Navelement (
  { content, link, active }: {content: string, link: string, active: boolean}
) {
  return <li className={styles.element}>
    <a
      href={link}
      className={
        active ? `${styles.link} ${styles.active}` : styles.link}
    >
      {content}
    </a>
  </li>
}
