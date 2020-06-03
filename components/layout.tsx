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
        <div id="themeswitch">
          <i className="material-icons">invert_colors</i>
        </div>
      </nav>
      <main>{children}</main>
    </>
  )
}
