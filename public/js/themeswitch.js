'use strict'

if (!localStorage.getItem('theme')) {
  localStorage.setItem('theme', 'dark')
}
document.documentElement.setAttribute('theme', localStorage.getItem('theme'))
