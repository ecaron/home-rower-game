/* global $, fetch, Avataaars */
$(document).ready(function () {
  const logout = document.querySelector('#logout')

  if (logout) {
    logout.onclick = function () {
      fetch('/logout', { method: 'DELETE', credentials: 'same-origin' })
        .then(function () {
          window.location = '/'
        })
    }
  }
  $('.avatar').each(function () {
    const avatar = $(this).data('details')
    const options = {}
    Object.keys(avatar).forEach(function (key) {
      if (avatar[key]) {
        options[key] = avatar[key]
      }
    })
    const svg = Avataaars.create(options)
    $(this).html(svg)
  })
})
