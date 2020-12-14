require('dotenv').config()
const debug = require('debug')('waterrower-ble:main')
const express = require('express')
const path = require('path')
const S4 = require('./s4')
const memoryMap = require('./s4/memory-map')
const BluetoothPeripheral = require('./bluetooth-peripheral')
const UsbPeripheral = require('./usb-peripheral')

const app = express()

const mainUsb = async function (callback, testMode) {
  const rower = new S4(memoryMap)
  if (testMode) {
    return rower.fakeRower(callback)
  }
  const rowerPort = await rower.findPort()
  if (rowerPort !== false) {
    return rower.startRower(callback)
  }
  // wait till we get the right serial
  debug('[Init] Awaiting WaterRower S4.2 to be connected to USB port')

  // monitor USB attach and detach events
  const usbPeripheral = new UsbPeripheral()
  usbPeripheral.monitorWr(function () {
    rower.startRower(callback)
  }, rower.stopRower(rower))
}

const main = function () {
  const listener = function () {
    const ble = new BluetoothPeripheral('WaterRower S4')
    return function (event) {
      console.log(event)
      if ('watts' in event) {
        ble.notify(event)
      }
    }
  }
  mainUsb(listener, process.env.TEST_MODE)

  app.get('/memory.json', function (req, res) {
    if (process.env.DEV) {
      memoryMap.forEach(response => {
        response.value = response.value ? response.value++ : response.value = 1
      })
    }
    res.send(memoryMap)
  })
  app.use('/chart', express.static(path.join(__dirname, 'node_modules', 'chart.js', 'dist')))
  app.use('/bulma', express.static(path.join(__dirname, 'node_modules', 'bulma', 'css')))
  app.use(express.static(path.join(__dirname, 'public')))
  app.listen(process.env.PORT || 8000)
}

main()
