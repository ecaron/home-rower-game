/* global $, fetch, Avataaars, alert, confirm */
function prettyDuration (duration, briefUnits) {
  if (!briefUnits) briefUnits = false
  duration = Math.round(duration / 1000)
  let output = ''; let i
  if (duration >= 3600) {
    i = Math.floor(duration / 3600)
    if (briefUnits) output += i + 'h'
    else output += i + ((i > 1) ? ' hours, ' : ' hour, ')
    duration -= i * 3600
  }
  if (duration >= 60 || output !== '') {
    i = Math.floor(duration / 60)
    if (briefUnits) output += i + 'm'
    else output += i + ((i > 1) ? ' minutes, ' : ' minute, ')
    duration -= i * 60
  }
  if (duration === 0) return output
  else if (briefUnits) return output + duration + 's'
  else return output + duration + ((duration === 1) ? ' second' : ' seconds')
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
  $('.info-rower').on('click', function (e) {
    e.preventDefault()
    $('.modal .modal-body').html('Loading...')
    appModal.show()
    fetch('/rower/' + $(this).data('rower') + '/logbook', { method: 'GET', credentials: 'same-origin' })
      .then(response => response.text())
      .then(response => {
        $('.modal .modal-body').html(response)
      }).catch(e => {
        $('.modal .modal-body').html('Sorry. Some error happened.')
        console.log(e)
      })
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
  var appModal = new bootstrap.Modal(document.getElementById('modal-1'), {
    keyboard: false
  })
})
