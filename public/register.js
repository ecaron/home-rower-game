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
    formOption = '<div class="col mb-3"><label for="' + path + '" class="form-label">' + prettyText(path) + '</label><select class="form-select" name="avatar[' + path + ']" id="' + path + '">'
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

    formOption = '<div class="col mb-3"><label for="' + colorType + '"  class="form-label">' + prettyText(colorType) + '</label>'
    formOption += '<select class="form-select" name="avatar[' + colorType + ']" id="' + colorType + '" ' + (customColor ? 'style="display:none"' : '') + '>'
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
    formOption += '<div class="form-check"><input type="checkbox" name="useColor[' + colorType + ']" class="form-check-input custom-color" id="use-custom-' + colorType + '" data-type="' + colorType + '" ' + (customColor ? 'checked' : '') + '/><label class="form-check-label" for="use-custom-' + colorType + '">Use Custom Color</label></div>'
    formOption += '<div><input class="right" type="color" name="customColor[' + colorType + ']" id="custom-' + colorType + '" value="' + customColor + '" ' + (customColor ? '' : 'style="display:none"') + '></div>'
    formOption += '</div>'
    $('#formInputs').append(formOption)
  })

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
