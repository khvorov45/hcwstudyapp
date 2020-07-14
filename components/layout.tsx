import Navbar from './navbar'
import { User } from '../lib/util'

export default function Layout (
  { children, user, active }: {
    children: React.ReactNode,
    user: User,
    active: string,
  }
) {
  return <>
    <Navbar
      user={user}
      active={active}
    />
    <main>{children}</main>
  </>
}
