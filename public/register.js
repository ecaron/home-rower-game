/* global $, Avataaars */
function prettyText (input) {
  return input.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase() })
}
$(document).ready(function () {
  const avatarGenerator = function () {
    const options = {
      width: 200,
      height: 200,
      style: 'none'
    }
    $('#form select').each(function () {
      if ($('#use-custom-' + this.id).length && $('#use-custom-' + this.id).is(':checked')) {
        options[this.id] = $('#custom-' + this.id).val()
      } else {
        if ($(this).val()) options[this.id] = $(this).val()
      }
    })
    const svg = Avataaars.create(options)
    $('#avatar').html(svg)
  }
  let formOption; let randomMatch; let optionCount; let preset = false; let selected; let customColor
  if ($('#avatar').data('details')) preset = $('#avatar').data('details')
  Object.keys(Avataaars.paths).forEach(function (path) {
    optionCount = 0
    selected = false
    formOption = '<div class="input-field col m4 s6"><div><label for="' + path + '">' + prettyText(path) + '</label></div><select class="browser-default" name="avatar[' + path + ']" id="' + path + '">'
    if (path === 'clothingGraphic') return
    if (path === 'accessories') {
      optionCount++
      formOption += '<option value="">None</option>'
    }

    if (path === 'skin') {
      randomMatch = Math.floor(Math.random() * Object.keys(Avataaars.colors.skin).length)
      Object.keys(Avataaars.colors.skin).forEach(function (option) {
        selected = false
        if (preset !== false) {
          if (option === preset[path]) selected = true
        } else {
          if (optionCount === randomMatch) selected = true
        }
        formOption += '<option value="' + option + '" ' + (selected ? 'selected' : '') + '>' + prettyText(option) + '</option>'
        optionCount++
      })
    } else {
      randomMatch = Math.floor(Math.random() * Object.keys(Avataaars.paths[path]).length)
      Object.keys(Avataaars.paths[path]).forEach(function (option) {
        selected = false
        if (preset !== false) {
          if (option === preset[path]) selected = true
        } else {
          if (optionCount === randomMatch) selected = true
        }
        formOption += '<option value="' + option + '" ' + (selected ? 'selected' : '') + '>' + prettyText(option) + '</option>'
        optionCount++
      })
    }
    formOption += '</select></div>'
    if (optionCount > 1) {
      $('#formInputs').append(formOption)
    }
  })
  const colorOptions = ['hairColor', 'hatColor', 'accessoriesColor', 'facialHairColor', 'clothingColor']
  colorOptions.forEach(function (colorType) {
    optionCount = 0
    customColor = false

    if (preset !== false) {
      if (preset[colorType].length === 7 && preset[colorType][0] === '#') {
        customColor = preset[colorType]
      }
    }

    formOption = '<div class="input-field col m4 s6"><div><label for="' + colorType + '">' + prettyText(colorType) + '</label></div>'
    formOption += '<select class="browser-default" name="avatar[' + colorType + ']" id="' + colorType + '" ' + (customColor ? 'style="display:none"' : '') + '>'
    if (colorType === 'hairColor' || colorType === 'facialHairColor') {
      randomMatch = Math.floor(Math.random() * Object.keys(Avataaars.colors.hair).length)
      Object.keys(Avataaars.colors.hair).forEach(function (option) {
        selected = false
        if (preset !== false) {
          if (option === preset[colorType]) selected = true
        } else {
          if (optionCount === randomMatch) selected = true
        }
        formOption += '<option value="' + option + '" ' + (selected ? 'selected' : '') + '>' + prettyText(option) + '</option>'
        optionCount++
      })
    } else {
      randomMatch = Math.floor(Math.random() * Object.keys(Avataaars.colors.palette).length)
      Object.keys(Avataaars.colors.palette).forEach(function (option) {
        selected = false
        if (preset !== false) {
          if (option === preset[colorType]) selected = true
        } else {
          if (optionCount === randomMatch) selected = true
        }
        formOption += '<option value="' + option + '" ' + (selected ? 'selected' : '') + '>' + prettyText(option) + '</option>'
        optionCount++
      })
    }
    formOption += '</select>'
    formOption += '<p class="left"><label><input type="checkbox" name="useColor[' + colorType + ']" class="custom-color" id="use-custom-' + colorType + '" data-type="' + colorType + '" ' + (customColor ? 'checked' : '') + '/><span>Use Custom Color</span></label></p>'
    formOption += '<p><input class="right" type="color" name="customColor[' + colorType + ']" id="custom-' + colorType + '" value="' + customColor + '" ' + (customColor ? '' : 'style="display:none"') + '></p>'
    formOption += '</div>'
    $('#formInputs').append(formOption)
  })
  $('select').formSelect()

  avatarGenerator()
  $('#form').on('change', avatarGenerator)
  $('#name').focus()
  $('.custom-color').on('click', function () {
    const type = $(this).data('type')
    if (this.checked) {
      $('#' + type).hide()
      $('#custom-' + type).show()
    } else {
      $('#' + type).show()
      $('#custom-' + type).hide()
    }
  })
})
