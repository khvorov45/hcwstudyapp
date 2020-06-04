import { ThemeSwitch } from './theme'

export default function Layout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <nav>
        <h1>Study reports</h1>
        <ThemeSwitch />
      </nav>
      <main>{children}</main>
    </>
  )
}
