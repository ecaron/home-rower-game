/* global jQuery, WebSocket, location, fetch, updateGraphs, prettyDuration, NoSleep */
jQuery(function () {
  const $ = jQuery
  let waterPos = 0
  let waterSpeed = 0
  let ws

  function getRandomInt (max) {
    return Math.floor(Math.random() * max)
  }

  let randomGreen = getRandomInt(255)
  let randomBlue = getRandomInt(255)
  let randomDirection = { green: 1, blue: 1, transparent: 0.4 }
  const randomColor = 'rgba(0,' + randomGreen + ',' + randomBlue + ',' + randomDirection.transparent + ')'

  const $water = $('#water')
  $water.css({ 'background-image': 'url(\'/images/water_' + getRandomInt(7) + '.jpg\')', 'background-color': randomColor })

  $('#startRace').on('click', function () {
    const $rower = $('#water #rower')
    const $competitor = $('#water #competitor')

    const noSleep = new NoSleep()
    noSleep.enable()

    $('#starting-line').addClass('dropoff')
    fetch('/compete/reset.json').then(updateGraphs)

    const cycleDirection = function () {
      if (randomGreen < 0) randomGreen = 0
      else if (randomGreen > 255) randomGreen = 255
      if (randomBlue < 0) randomBlue = 0
      else if (randomBlue > 255) randomBlue = 255

      const random = Math.random()
      if (random < 0.25) {
        randomDirection = { green: 1, blue: 1, transparent: randomDirection.transparent }
      } else if (random < 0.5) {
        randomDirection = { green: -1, blue: 1, transparent: randomDirection.transparent }
      } else if (random < 0.75) {
        randomDirection = { green: -1, blue: -1, transparent: randomDirection.transparent }
      } else {
        randomDirection = { green: 1, blue: -1, transparent: randomDirection.transparent }
      }
      // Randomizing the alpha layer turned out to be overkill
      // if (Math.floor(random * 10) % 2 === 1) {
      // randomDirection.transparent = Math.random()
      // }
    }

    setInterval(function () {
      if (waterSpeed > 0) {
        waterPos += waterSpeed
        randomGreen += randomDirection.green * getRandomInt(2)
        randomBlue += randomDirection.blue * getRandomInt(2)
        if (randomGreen < 0 || randomGreen > 255 || randomBlue < 0 || randomBlue > 255) {
          cycleDirection()
        }
        const randomColor = 'rgba(0,' + randomGreen + ',' + randomBlue + ',' + randomDirection.transparent + ')'
        $('#water').css({ 'background-position': '0 ' + waterPos + 'px', 'background-color': randomColor })
      }
    }, 100)

    $('#cancelRace').hide()
    $('.toggles').hide().removeClass('d-none')
    $('#startRace').fadeOut('slow', function () {
      $('.toggles').fadeIn('fast')
    })
    const $messages = $('#messages')
    const $raceMode = $('#mode')
    let raceValue = false
    if ($raceMode.data('value')) raceValue = parseInt($raceMode.data('value'))

    const updateCountdown = function (amountLeft) {
      if ($raceMode.data('type') === 'time') {
        amountLeft = raceValue * 60 * 1000 - (new Date() - startTime)
        $messages.text('Time remaining: ' + prettyDuration(amountLeft))
        setTimeout(updateCountdown, 5000)
      } else if ($raceMode.data('type') === 'marathon') {
        setInterval(function () {
          $messages.text('Time elapsed: ' + prettyDuration((new Date() - startTime)))
        }, 500)
        $messages.text('Time elapsed: ' + prettyDuration((new Date() - startTime)))
      } else {
        $messages.text('Distance remaining: ' + amountLeft + ' meters')
      }
      if ($raceMode.data('type') !== 'marathon' && amountLeft <= 0) {
        $('#endRace').trigger('click')
      }
    }

    $('#endRace').on('click', function () {
      try {
        ws.send(JSON.stringify({ status: 'end' }))
        ws.close()
      } catch (e) {}
      window.location = '/compete/results'
    })

    const startTime = new Date()
    let started = false

    $('#record').hide()
    $messages.html('Wait for it&hellip;')

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
          updateCountdown(raceValue)
          started = true
        }
        if (data.status === 'update') {
          let distanceUnits = 'm'
          if (data.distance > 1000) {
            data.distance = (data.distance / 1000).toFixed(2)
            distanceUnits = 'km'
          } else {
            data.distance = Math.round(data.distance)
          }
          if (data.target === 'rower') {
            updateCountdown(raceValue - data.distance)
            $rower.find('.stats').html(`${data.speed.toFixed(2)} ${data.speedUnits}<br>${data.distance}${distanceUnits}`)
            waterSpeed = data.speed * 7
          } else {
            if ($competitor.length && competitorActive === true) {
              $competitor.find('.stats').html(`${data.speed.toFixed(2)} ${data.speedUnits}<br>${data.distance}${distanceUnits}`)
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
