/* global $ */
let waterPos = 0; let waterSpeed = 10
$('#startRace').on('click', function () {
  $('#starting-line').addClass('dropoff')
  setInterval(function () {
    $('#water').css('background-position', '0 ' + waterPos + 'px')
    waterPos += waterSpeed
  }, 200)
  $('#startRace').fadeOut('slow', function () {
    $('#speedUp').fadeIn('fast')
    $('#speedDown').fadeIn('fast')
  })
})
$('#speedUp').on('click', function () { waterSpeed += 10 })
$('#speedDown').on('click', function () { waterSpeed -= 10 })
