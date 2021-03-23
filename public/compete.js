/* global $, WebSocket, location, fetch, updateGraphs, prettyDuration */
$(document).ready(function () {
  let waterPos = 0; let waterSpeed = 0
  let ws

  $('#startRace').on('click', function () {
    const $water = $('#water')
    const $rower = $('#water #rower')
    const $competitor = $('#water #competitor')

    $('#starting-line').addClass('dropoff')
    fetch('/compete/reset.json').then(updateGraphs)

    setInterval(function () {
      $water.css('background-position', '0 ' + waterPos + 'px')
      waterPos += waterSpeed
    }, 100)

    $('#startRace').fadeOut('slow', function () {
      $('.toggles').fadeIn('fast')
    })

    $('#endRace').on('click', function () {
      try {
        ws.send(JSON.stringify({ status: 'end' }))
        ws.close()
      } catch (e) {}
      window.location = '/compete/results'
    })

    const startTime = new Date()
    let started = false
    const $timer = $('#timer h4')

    $timer.html('Wait for it&hellip;')

    function connect () {
      if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null
        ws.close()
      }

      let competitorActive = true
      ws = new WebSocket(`ws://${location.host}`)
      ws.onmessage = function (event) {
        const data = JSON.parse(event.data)
        if (started === false || data.status === 'start') {
          started = true
          setInterval(function () {
            $timer.html(prettyDuration((new Date() - startTime)))
          }, 500)
          $timer.html(prettyDuration((new Date() - startTime)))
        }
        if (data.status === 'update') {
          let distanceUnits = 'm'
          if (data.distance > 2000) {
            data.distance = (data.distance / 1000).toFixed(2)
            distanceUnits = 'km'
          } else {
            data.distance = Math.round(data.distance)
          }
          if (data.target === 'rower') {
            $rower.find('.stats').html(`${data.speed} ${data.speedUnits}<br>${data.distance}${distanceUnits}`)
            waterSpeed = data.speed * 7
          } else {
            if (competitorActive === true) {
              $competitor.find('.stats').html(`${data.speed} ${data.speedUnits}<br>${data.distance}${distanceUnits}`)
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
