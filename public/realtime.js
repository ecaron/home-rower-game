/* global localStorage, Chart, fetch, alert */
'use strict'

const chartColors = {
  white: 'rgb(255, 255, 255)',
  black: 'rgb(0, 0, 0)',
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
}
let adjustedToggles = JSON.parse(localStorage.getItem('toggles'))
let visibleGraphs = 0
const graphs = {}
const toggleDiv = document.getElementById('toggles')
const graphsDiv = document.getElementById('graphs')

function mobileCheck () {
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(a.substr(0, 4))) check = true })(navigator.userAgent || navigator.vendor || window.opera)
  return check
}

function toggleBlock () {
  const attribute = this.getAttribute('data-canvas')
  if (this.checked) {
    document.getElementById('wrapper-' + attribute).style.display = 'block'
    visibleGraphs++
  } else {
    document.getElementById('wrapper-' + attribute).style.display = 'none'
    visibleGraphs--
  }

  adjustedToggles = {}
  Object.keys(graphs).forEach(function (graphName) {
    adjustedToggles[graphName] = document.getElementById('toggle-' + graphName).checked
  })

  localStorage.setItem('toggles', JSON.stringify(adjustedToggles))
  resizeGraphs()
}

function resizeGraphs () {
  if (mobileCheck() === false) {
    const divider = Math.ceil(Math.sqrt(visibleGraphs))
    const gridWidth = Math.floor((window.innerWidth - 50) / divider)
    let gridRows = 1
    while (gridRows * divider < visibleGraphs) gridRows++
    const gridHeight = Math.floor((window.innerHeight - toggleDiv.offsetHeight - 30) / gridRows)

    Object.keys(graphs).forEach(function (graphName) {
      document.getElementById('wrapper-' + graphName).style.width = gridWidth + 'px'
      document.getElementById('wrapper-' + graphName).style.height = gridHeight + 'px'
      graphs[graphName].chart.update()
    })
  }
}

window.onresize = resizeGraphs

function defineGraph (response) {
  const newToggle = document.createElement('div')
  newToggle.style = 'display:inline-block;margin-right:25px'
  newToggle.innerHTML = '<label for="toggle-' + response.name + '"><input type="checkbox" checked="checked" id="toggle-' + response.name + '" data-canvas="' + response.name + '"><span style="padding-left:25px">' + (response.desc || response.name) + '</span></label>'
  toggleDiv.appendChild(newToggle)
  document.getElementById('toggle-' + response.name).addEventListener('click', toggleBlock, false)

  const newCanvasWrapper = document.createElement('div')
  newCanvasWrapper.style = 'float:left;margin:1px;position:relative'
  newCanvasWrapper.setAttribute('id', 'wrapper-' + response.name)
  const newCanvas = document.createElement('canvas')
  newCanvas.style = 'width:100%;height:100%'
  newCanvas.setAttribute('id', 'canvas-' + response.name)
  newCanvasWrapper.appendChild(newCanvas)

  const currentValue = document.createElement('div')
  currentValue.classList.add('counter')
  currentValue.classList.add('pre-animation')
  currentValue.style = 'top:25%;padding-left:10%;width:80%;text-align:center;position:absolute;font-size:64px;opacity:0.8;text-shadow:1px 1px black;line-height:48px'
  currentValue.innerHTML = (Math.round((response.value + Number.EPSILON) * 100) / 100) + ' ' + response.unit
  currentValue.setAttribute('id', 'currentval-' + response.name)
  newCanvasWrapper.appendChild(currentValue)

  graphsDiv.appendChild(newCanvasWrapper)
  visibleGraphs++

  graphs[response.name] = {}
  graphs[response.name].lineChartData = {
    labels: [new Date()],
    datasets: [{
      label: response.name,
      borderColor: chartColors.blue,
      backgroundColor: chartColors.grey,
      fill: false,
      data: [{ t: new Date(), y: response.value }]
    }]
  }
  const ctx = document.getElementById('canvas-' + response.name).getContext('2d')
  graphs[response.name].chart = Chart.Line(ctx, {
    data: graphs[response.name].lineChartData,
    options: {
      legend: {
        display: false
      },
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: response.desc || response.name
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            displayFormats: {
              millisecond: 'h:mm:ss a',
              second: 'h:mm:ss a',
              minute: 'h:mm a',
              hour: 'h:mm a',
              day: 'h:mm a',
              week: 'h:mm a',
              month: 'h:mm a',
              quarter: 'h:mm a',
              year: 'h:mm a'
            }
          }
        }],
        yAxes: [{
          type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
          display: true,
          position: 'left'
        }]
      }
    }
  })
  if (adjustedToggles && typeof adjustedToggles[response.name] !== 'undefined' && !adjustedToggles[response.name]) {
    document.getElementById('wrapper-' + response.name).style.display = 'none'
    document.getElementById('toggle-' + response.name).checked = false
    visibleGraphs--
  }
  resizeGraphs()
}

function updateGraphs () {
  fetch('/compete/memory.json')
    .then(response => response.json())
    .then(graphResponses => {
      graphResponses.forEach(function (response) {
        if (response.value) {
          if (typeof graphs[response.name] === 'undefined') {
            defineGraph(response)
          } else {
            const overlayValue = (Math.round((response.value + Number.EPSILON) * 100) / 100) + ' ' + response.unit
            if (document.getElementById('currentval-' + response.name).innerHTML !== overlayValue) {
              document.getElementById('currentval-' + response.name).style.opacity = 0
              setTimeout(function () {
                document.getElementById('currentval-' + response.name).innerHTML = overlayValue
                document.getElementById('currentval-' + response.name).style.opacity = 1
              }, 800)
            }

            graphs[response.name].lineChartData.labels.push(new Date())
            graphs[response.name].lineChartData.datasets[0].data.push({ t: new Date(), y: response.value })
            graphs[response.name].chart.update()
          }
        }
      })
      setTimeout(updateGraphs, 5000)
    })
    .catch((error) => {
      console.error('Error:', error)
      alert('Connection interrupted. Try again?')
      setTimeout(updateGraphs, 5000)
    })
}
updateGraphs()
