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
          <i onClick={changeTheme} className="material-icons">invert_colors</i>
        </div>
      </nav>
      <main>{children}</main>
    </>
  )
}

function changeTheme () {
  let theme: string
  if (document.documentElement.getAttribute('theme') === 'dark') {
    theme = 'light'
  } else {
    theme = 'dark'
  }
  localStorage.setItem('theme', theme)
  document.documentElement.setAttribute('theme', theme)
}
