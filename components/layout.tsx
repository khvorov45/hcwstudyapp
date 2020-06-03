import { ThemeSwitch } from './theme'

export default function Layout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <nav>
        <div id="title">
          <h1>Study reports</h1>
        </div>
        <ThemeSwitch />
      </nav>
      <main>{children}</main>
    </>
  )
}
