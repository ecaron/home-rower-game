/* global $, fetch, Avataaars, alert, confirm */
function prettyDuration (duration) {
  duration = Math.round(duration / 1000)
  let output = ''; let i
  if (duration >= 3600) {
    i = Math.floor(duration / 3600)
    output += i + ((i > 1) ? ' hours, ' : ' hour, ')
    duration -= i * 3600
  }
  if (duration >= 60 || output !== '') {
    i = Math.floor(duration / 60)
    output += i + ((i > 1) ? ' minutes, ' : ' minute, ')
    duration -= i * 60
  }
  return output + duration + ((duration === 1) ? ' second' : ' seconds')
}

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
  $('.delete-rower').on('click', function (e) {
    e.preventDefault()
    if (confirm('Are you sure?')) {
      fetch('/rower/' + $(this).data('rower'), { method: 'DELETE', credentials: 'same-origin' })
        .then(response => response.json())
        .then(response => {
          if (response.error) alert(response.error)
          else window.location = '/'
        })
    }
    return false
  })
  $('.avatar').each(function () {
    const avatar = $(this).data('details')
    const options = { style: 'none' }
    Object.keys(avatar).forEach(function (key) {
      if (avatar[key]) {
        options[key] = avatar[key]
      }
    })
    const svg = Avataaars.create(options)
    $(this).html(svg)
  })
  $('.prettyTime').each(function () {
    $(this).text(prettyDuration($(this).text()))
  })
})
