import Navbar from './navbar'
import { User } from '../lib/util'

export default function Layout (
  { children, user, active }: {
    children: React.ReactNode,
    user: User,
    active: string,
  }
) {
  if (!user.authorised) return <></>
  return <>
    <Navbar
      user={user}
      active={active}
    />
    <main>{children}</main>
  </>
}
