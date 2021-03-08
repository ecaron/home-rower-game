/* global $, WebSocket, location */
$(document).ready(function () {
  let waterPos = 0; let waterSpeed = 100
  let ws

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

    $('#endRace').on('click', function () {
      ws.send(JSON.stringify({ status: 'end' }))
      ws.close()
      window.location = '/'
    })

    const startTime = new Date()
    const $timer = $('#timer h4')
    setInterval(function () {
      $timer.html(prettyDuration((new Date() - startTime)))
    }, 500)

    function connect () {
      if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null
        ws.close()
      }

      let competitorActive = true
      ws = new WebSocket(`ws://${location.host}`)
      ws.onmessage = function (event) {
        const data = JSON.parse(event.data)
        if (data.status === 'update') {
          let distanceUnits = 'm'
          if (data.distance > 2000) {
            data.distance = (data.distance / 1000).toFixed(2)
            distanceUnits = 'km'
          }
          if (data.target === 'rower') {
            $rower.find('.stats').html(`${data.speed} ${data.speedUnits}<br>${data.distance} ${distanceUnits}`)
          } else {
            if (competitorActive === true) {
              $competitor.find('.stats').html(`${data.speed} ${data.speedUnits}<br>${data.distance} ${distanceUnits}`)
            }
          }
          $rower.css('bottom', Math.round(data.position.rower * 75) + '%')
          if (competitorActive === true) {
            $competitor.css('bottom', Math.round(data.position.competitor * 75) + '%')
          }
        } else if (data.status === 'competitorDone') {
          competitorActive = false
          $competitor.css('bottom', 0 + '%')
          $competitor.find('.stats').html('<b>Finished</b><br>' + $competitor.find('.stats').html())
        }
      }
      ws.onerror = function () {
        console.log('WebSocket error')
        ws.close()
      }
      ws.onopen = function () {
        console.log('WebSocket connection established')
        // ws.send('Race Start!')
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
  if ($('#recordDate').length) {
    $('#recordDate').text((new Date($('#recordDate').data('value'))).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    if (parseInt($('#recordDistance').data('value'), 10) > 2000) {
      $('#recordDistance').text((parseInt($('#recordDistance').data('value')) / 1000).toFixed(2) + 'km')
    } else {
      $('#recordDistance').text($('#recordDistance').data('value') + 'm')
    }
    $('#recordDuration').text(prettyDuration($('#recordDuration').data('value')))
  }
})
