/* global $, Avataaars */
function prettyText (input) {
  return input.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase() })
}
$(document).ready(function () {
  const avatarGenerator = function () {
    const options = {
      width: 200,
      height: 200
    }
    $('#form select').each(function () {
      if ($(this).val()) options[this.id] = $(this).val()
    })
    const svg = Avataaars.create(options)
    $('#avatar').html(svg)
  }
  let formOption, randomMatch, optionCount
  Object.keys(Avataaars.paths).forEach(function (path) {
    optionCount = 0
    formOption = '<div class="input-field col m4 s6"><select name="avatar[' + path + ']" id="' + path + '">'
    if (path === 'clothingGraphic') return
    if (path === 'accessories') {
      optionCount++
      formOption += '<option value="">None</option>'
    }

    if (path === 'skin') {
      randomMatch = Math.floor(Math.random() * Object.keys(Avataaars.colors.skin).length)
      Object.keys(Avataaars.colors.skin).forEach(function (option) {
        formOption += '<option value="' + option + '" ' + (optionCount === randomMatch ? 'selected' : '') + '>' + prettyText(option) + '</option>'
        optionCount++
      })
    } else {
      randomMatch = Math.floor(Math.random() * Object.keys(Avataaars.paths[path]).length)
      Object.keys(Avataaars.paths[path]).forEach(function (option) {
        formOption += '<option value="' + option + '" ' + (optionCount === randomMatch ? 'selected' : '') + '>' + prettyText(option) + '</option>'
        optionCount++
      })
    }
    formOption += '</select><label for="' + path + '">' + prettyText(path) + '</label></div>'
    if (optionCount > 1) {
      $('#formInputs').append(formOption)
    }
  })
  const colorOptions = ['hairColor', 'hatColor', 'accessoriesColor', 'facialHairColor', 'clothingColor']
  colorOptions.forEach(function (colorType) {
    optionCount = 0
    formOption = '<div class="input-field col m4 s6"><select name="avatar[' + colorType + ']" id="' + colorType + '">'
    if (colorType === 'hairColor' || colorType === 'facialHairColor') {
      randomMatch = Math.floor(Math.random() * Object.keys(Avataaars.colors.hair).length)
      Object.keys(Avataaars.colors.hair).forEach(function (option) {
        formOption += '<option value="' + option + '" ' + (optionCount === randomMatch ? 'selected' : '') + '>' + prettyText(option) + '</option>'
        optionCount++
      })
    } else {
      randomMatch = Math.floor(Math.random() * Object.keys(Avataaars.colors.palette).length)
      Object.keys(Avataaars.colors.palette).forEach(function (option) {
        formOption += '<option value="' + option + '" ' + (optionCount === randomMatch ? 'selected' : '') + '>' + prettyText(option) + '</option>'
        optionCount++
      })
    }
    formOption += '</select><label for="' + colorType + '">' + prettyText(colorType) + '</label></div>'
    $('#formInputs').append(formOption)
  })
  $('select').formSelect()

  avatarGenerator()
  $('#form').on('change', avatarGenerator)
  $('#name').focus()
})
