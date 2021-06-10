/* global jQuery, WebSocket, location, fetch, updateGraphs, getRandomInt, prettyDuration, prettyDistance, NoSleep */
jQuery(function () {
  const $ = jQuery
  const noSleep = new NoSleep()
  const $water = $('#water')
  const $rower = $('#water #rower')
  const $competitor = $('#water #competitor')
  const $messages = $('#messages')
  const $record = $('#record')
  const ws = new WebSocket(`ws://${location.host}`)
  let countdownInterval

  const raceData = {
    mode: {
      type: $('#mode').data('type'),
      value: parseInt($('#mode').data('value'))
    },
    rower: {
      distance: 0
    },
    readyToStart: false,
    startTime: false,
    ended: false,
    water: {
      pos: 0,
      speed: 0,
      green: getRandomInt(255),
      blue: getRandomInt(255),
      transparent: 0.4,
      direction: {
        green: 1,
        blue: 1
      }
    }
  }
  if ($record.length) {
    raceData.competitor = {
      record: parseInt($record.data('value'))
    }
  }

  const cycleDirection = function () {
    if (raceData.water.green < 0) raceData.water.green = 0
    else if (raceData.water.green > 255) raceData.water.green = 255
    if (raceData.water.blue < 0) raceData.water.blue = 0
    else if (raceData.water.blue > 255) raceData.water.blue = 255

    const random = Math.random()
    if (random < 0.25) {
      raceData.water.direction = { green: 1, blue: 1 }
    } else if (random < 0.5) {
      raceData.water.direction = { green: -1, blue: 1 }
    } else if (random < 0.75) {
      raceData.water.direction = { green: -1, blue: -1 }
    } else {
      raceData.water.direction = { green: 1, blue: -1 }
    }
  }

  const socketConnect = function () {
    if (ws && ws.onopen !== null) {
      ws.onerror = ws.onopen = ws.onclose = null
      ws.close()
    }

    let competitorActive = true
    ws.onmessage = function (event) {
      const data = JSON.parse(event.data)
      if (data.status === 'update') {
        if (raceData.readyToStart === true && raceData.startTime === false) {
          startRace()
        }
        if (data.target === 'rower') {
          raceData.rower.distance = data.distance
          updateCountdown()
          $rower.find('.stats').html(`${parseFloat(data.speed.toFixed(2))} ${data.speedUnits}<br>${prettyDistance(data.distance)}`)
          raceData.water.speed = data.speed * 20
        } else {
          if ($competitor.length && competitorActive === true) {
            $competitor.find('.stats').html(`${parseFloat(data.speed.toFixed(2))} ${data.speedUnits}<br>${prettyDistance(data.distance)}`)
          }
        }
        $rower.css('bottom', Math.round(data.position.rower * 75) + '%')
        if ($competitor.length) $competitor.css('bottom', Math.round(data.position.competitor * 75) + '%')
      } else if ($competitor.length && data.status === 'competitorDone') {
        competitorActive = false
        $competitor.find('.stats').html('<b>Finished</b><br>' + $competitor.find('.stats').html())
      }
    }
    ws.onerror = function () {
      console.log('WebSocket error')
      ws.close()
    }
    ws.onopen = function () {
      console.log('WebSocket connection established')
    }
    ws.onclose = function () {
      console.log('WebSocket connection closed')
      setTimeout(socketConnect, 1000)
    }
  }

  const updateCountdown = function () {
    if (raceData.startTime === false || raceData.ended === true) return
    let endRace = false
    let messageHTML = ''
    const timeElapsed = new Date() - raceData.startTime
    if (raceData.mode.type === 'time') {
      const timeLeft = (raceData.mode.value * 60 * 1000) - timeElapsed
      messageHTML += 'Time remaining: <strong>' + prettyDuration(timeLeft) + '</strong>'
      if (raceData.competitor) {
        if (raceData.competitor.record > raceData.rower.distance) {
          messageHTML += '<br>Distance to win: <strong>' + prettyDistance(raceData.competitor.record - raceData.rower.distance) + '</strong>'
        } else {
          messageHTML += '<br>Won race by: <strong>' + prettyDistance(raceData.rower.distance - raceData.competitor.record) + '</strong>'
        }
      } else {
        messageHTML += '<br>Distance rowed: <strong>' + prettyDistance(raceData.rower.distance) + '</strong>'
      }
      if (timeLeft <= 0 && raceData.ended === false) {
        endRace = true
      }
    } else if (raceData.mode.type === 'marathon') {
      if (raceData.competitor) {
        if (raceData.competitor.record > raceData.rower.distance) {
          messageHTML += 'Distance to win: <strong>' + prettyDistance(raceData.competitor.record - raceData.rower.distance) + '</strong>'
        } else {
          messageHTML += 'Won race by: <strong>' + prettyDistance(raceData.rower.distance - raceData.competitor.record) + '</strong>'
        }
      } else {
        messageHTML += 'Distance rowed: <strong>' + prettyDistance(raceData.rower.distance) + '</strong>'
      }
    } else if (raceData.mode.type === 'length') {
      messageHTML += 'Distance remaining: <strong>' + prettyDistance(raceData.mode.value - raceData.rower.distance) + '</strong>'
      if (raceData.competitor) {
        if (raceData.competitor && raceData.competitor.record < timeElapsed) {
          messageHTML += '<br>Lost by: <strong>' + prettyDuration(timeElapsed - raceData.competitor.record) + '</strong>'
        } else {
          messageHTML += '<br>Time to win: <strong>' + prettyDuration(raceData.competitor.record - timeElapsed) + '</strong>'
        }
      } else {
        messageHTML += '<br>Time rowed: <strong>' + prettyDuration(timeElapsed) + '</strong>'
      }
      if (raceData.mode.value <= raceData.rower.distance && raceData.ended === false) {
        endRace = true
      }
    }
    $messages.html(messageHTML)
    if (endRace === true) {
      clearInterval(countdownInterval)
      raceData.ended = true
      setTimeout(function () {
        $('#endRace').trigger('click')
      }, 1000)
    }
  }

  $water.css({
    'background-image': 'url(\'/images/water_' + getRandomInt(7) + '.jpg\')',
    'background-color': 'rgba(0,' + raceData.water.green + ',' + raceData.water.blue + ',' + raceData.water.transparent + ')'
  })

  $('#startRace').on('click', function () {
    noSleep.enable()
    raceData.readyToStart = true
    fetch('/compete/reset.json').then(updateGraphs).then(socketConnect)
    $messages.html('Wait for the beep, then start rowing!')
  })

  const startRace = function () {
    raceData.startTime = new Date()
    $('#starting-line').addClass('dropoff')
    updateGraphs()

    setInterval(function () {
      if (raceData.water.speed > 0) {
        raceData.water.pos += raceData.water.speed
        raceData.water.green += raceData.water.direction.green * getRandomInt(2)
        raceData.water.blue += raceData.water.direction.blue * getRandomInt(2)
        if (raceData.water.green < 0 || raceData.water.green > 255 || raceData.water.blue < 0 || raceData.water.blue > 255) {
          cycleDirection()
        }
        $('#water').css({
          'background-position': '0 ' + raceData.water.pos + 'px',
          'background-color': 'rgba(0,' + raceData.water.green + ',' + raceData.water.blue + ',' + raceData.water.transparent + ')'
        })
      }
    }, 500)

    $('#cancelRace').hide()
    $('.toggles').hide().removeClass('d-none')
    $('#startRace').fadeOut('slow', function () {
      $('.toggles').fadeIn('fast')
    })

    countdownInterval = setInterval(updateCountdown, 1000)
  }

  $('#endRace').on('click', function () {
    try {
      ws.send(JSON.stringify({ status: 'end' }))
      ws.close()
    } catch (e) {
      console.log(e)
    }
    // Pause half a second to delete the database & sockets catch up
    setTimeout(function () {
      window.location = '/compete/results'
    }, 1000)
  })

  if ($('#recordDate').length) {
    $('#recordDate').text((new Date($('#recordDate').data('value'))).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
  }
})
