/* global $, fetch, location, Avataaars, WebSocket */
(function () {
  const messages = document.querySelector('#messages')
  const wsButton = document.querySelector('#wsButton')
  const wsSendButton = document.querySelector('#wsSendButton')
  const logout = document.querySelector('#logout')
  const login = document.querySelector('#login')

  function showMessage (message) {
    messages.textContent += `\n${message}`
    messages.scrollTop = messages.scrollHeight
  }

  function handleResponse (response) {
    return response.ok
      ? response.json().then((data) => JSON.stringify(data, null, 2))
      : Promise.reject(new Error('Unexpected response'))
  }

  if (login) {
    login.onclick = function () {
      fetch('/login', { method: 'POST', credentials: 'same-origin' })
        .then(handleResponse)
        .then(showMessage)
        .catch(function (err) {
          showMessage(err.message)
        })
    }
  }

  if (logout) {
    logout.onclick = function () {
      fetch('/logout', { method: 'DELETE', credentials: 'same-origin' })
        .then(handleResponse)
        .then(showMessage)
        .catch(function (err) {
          if (err) console.warn(err)
          window.location = '/'
        })
    }
  }

  let ws
  if (wsButton) {
    wsButton.onclick = function () {
      if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null
        ws.close()
      }

      ws = new WebSocket(`ws://${location.host}`)
      ws.onerror = function () {
        showMessage('WebSocket error')
      }
      ws.onopen = function () {
        showMessage('WebSocket connection established')
      }
      ws.onclose = function () {
        showMessage('WebSocket connection closed')
        ws = null
      }
    }
  }

  if (wsSendButton) {
    wsSendButton.onclick = function () {
      if (!ws) {
        showMessage('No WebSocket connection')
        return
      }

      ws.send('Hello World!')
      showMessage('Sent "Hello World!"')
    }
  }
})()

$(document).ready(function () {
  $('.avatar').each(function () {
    const options = $(this).data('details')
    const svg = Avataaars.create(options)
    $(this).html(svg)
  })
})
