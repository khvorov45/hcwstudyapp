import React from 'react'

export class ThemeSwitch extends React.Component {
  changeTheme () {
    let theme: string
    if (document.documentElement.getAttribute('theme') === 'dark') {
      theme = 'light'
    } else {
      theme = 'dark'
    }
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('theme', theme)
  }

  render () {
    return (
      <i
        id="themeswitch"
        onClick={this.changeTheme}
        className="material-icons"
      >
          invert_colors
      </i>
    )
  }
}
