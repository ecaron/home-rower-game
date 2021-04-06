/* global Chart, fetch, prettyDuration */
/* eslint-disable no-unused-vars */
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
const graphs = {}
const graphsDiv = document.getElementById('graphs')
const presetGraphs = ['ms_average', 'stroke_cnt']

function defineGraph (response) {
  const newCanvasWrapper = document.createElement('div')
  newCanvasWrapper.style = 'margin:1px;position:relative;height:' + Math.floor(window.innerHeight / 4) + 'px'
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

  graphs[response.name] = {}
  graphs[response.name].firstUpdate = new Date()
  graphs[response.name].lineChartData = {
    labels: ['0s'],
    datasets: [{
      label: response.name,
      borderColor: chartColors.blue,
      backgroundColor: chartColors.grey,
      fill: false,
      data: [response.value]
    }]
  }
  const ctx = document.getElementById('canvas-' + response.name).getContext('2d')
  graphs[response.name].chart = new Chart(ctx, {
    type: 'line',
    data: graphs[response.name].lineChartData,
    options: {
      maintainAspectRatio: false,
      title: {
        display: false
      },
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left'
        }
      }
    }
  })
}

function updateGraphs () {
  fetch('/compete/memory.json')
    .then(response => response.json())
    .then(graphResponses => {
      graphResponses.forEach(function (response) {
        if (response.value) {
          if (presetGraphs.indexOf(response.name) < 0) return
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

            const newTime = new Date() - graphs[response.name].firstUpdate
            graphs[response.name].lineChartData.labels.push(prettyDuration(newTime, true))
            graphs[response.name].lineChartData.datasets[0].data.push(response.value)
            graphs[response.name].chart.update('none')
          }
        }
      })
      setTimeout(updateGraphs, 5000)
    })
    .catch((error) => {
      console.error('Error:', error)
      setTimeout(updateGraphs, 5000)
    })
}
