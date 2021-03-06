/* global $, Avataaars */
$(document).ready(function () {
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
  $('#rower, #competitor').each(function () {
    const avatar = $(this).data('avatar')
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
