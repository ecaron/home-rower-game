/* global $, WebSocket, location */
$(document).ready(function () {
  let waterPos = 0; let waterSpeed = 100
  let ws
  $('#startRace').on('click', function () {
    const $water = $('#water')
    const $rower = $('#water #rower')
    const $competitor = $('#water #competitor')

    $('#starting-line').addClass('dropoff')

    setInterval(function () {
      $water.css('background-position', '0 ' + waterPos + 'px')
      waterPos += waterSpeed
    }, 900)

    $('#startRace').fadeOut('slow', function () {
      $('#toggles').fadeIn('fast')
    })

    const startTime = new Date()
    const $timer = $('#timer h4')
    setInterval(function () {
      let curElapse = Math.round((new Date() - startTime) / 1000); let output = ''; let i
      if (curElapse > 3600) {
        i = Math.floor(curElapse / 3600)
        output += i + ((i > 1) ? ' hours, ' : ' hour, ')
        curElapse -= i * 3600
      }
      if (curElapse > 60 || output !== '') {
        i = Math.floor(curElapse / 60)
        output += i + ((i > 1) ? ' minutes, ' : ' minute, ')
        curElapse -= i * 60
      }
      $timer.html(output + curElapse + ((curElapse === 1) ? ' second' : ' seconds'))
    }, 500)

    function connect () {
      if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null
        ws.close()
      }

      ws = new WebSocket(`ws://${location.host}`)
      ws.onmessage = function (event) {
        const data = JSON.parse(event.data)
        $rower.css('bottom', Math.round(data.rower.position * 75) + '%')
        $rower.find('.stats').html(`${data.rower.speed} ${data.rower.speedUnits}<br>${data.rower.distance} ${data.rower.distanceUnits}`)
        $competitor.css('bottom', Math.round(data.competitor.position * 75) + '%')
        $competitor.find('.stats').html(`${data.competitor.speed} ${data.competitor.speedUnits}<br>${data.competitor.distance} ${data.competitor.distanceUnits}`)
      }
      ws.onerror = function () {
        console.log('WebSocket error')
        ws.close()
      }
      ws.onopen = function () {
        console.log('WebSocket connection established')
        ws.send('Race Start!')
      }
      ws.onclose = function () {
        console.log('WebSocket connection closed')
        setTimeout(function () {
          connect()
        }, 1000)
      }
    }
    connect()
  })
  $('#speedUp').on('click', function () { waterSpeed = waterSpeed * 2 })
  $('#speedDown').on('click', function () { waterSpeed = Math.ceil(waterSpeed / 2) })
})
