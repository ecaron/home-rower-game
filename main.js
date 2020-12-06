require('dotenv').config()
const debug = require('debug')('main')
const S4 = require('./s4')
const peripheral = require('./bluetooth-peripheral')
const network = require('./network')
const usb = require('./usb-peripheral')

const mainBle = function (testMode) {
  const ble = new peripheral.BluetoothPeripheral('WaterRower S4')

  if (testMode) {
    const rower = new S4()
    rower.fakeRower(ble.notify)
  } else {
    const listener = new network.MessageListener(ble.notify)
    listener.start()
  }
}

const mainUsb = async function (callback, testMode) {
  const rower = new S4()
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
  const usbPeripheral = new usb.UsbPeripheral()
  usbPeripheral.monitorWr(function () {
    rower.startRower(callback)
  }, rower.stopRower(rower))
}

const main = function (args) {
  const runMode = args[2] || process.env.RUN_MODE
  const testMode = args[3] === '--test' || process.env.TEST_MODE
  if (runMode === 'usb') {
    const broadcasterNotify = function () {
      const broadcaster = new network.MessageBroadcaster()
      broadcaster.start()
      return broadcaster.send
    }
    mainUsb(broadcasterNotify, testMode)
  } else if (runMode === 'ble') {
    mainBle(testMode)
  } else if (runMode === 'ant') {
    const antNotify = function () {
      const ant = require('./power-meter')
      const pm = new ant.PowerMeter()
      let ts = 0
      let revCount = 0
      return function (event) {
        if ('watts' in event) {
          if (ts === 0) {
            ts = Date.now()
          } else {
            const now = Date.now()
            const delta = (now - ts) / 1000 / 60
            ts = now
            const revs = event.rev_count - revCount
            revCount = event.rev_count
            const cadence = Math.round(revs / delta)
            pm.broadcast(event.watts, cadence)
          }
        }
      }
    }

    mainUsb(antNotify, testMode)
  } else {
    const listener = function () {
      const ble = new peripheral.BluetoothPeripheral('WaterRower S4')
      const ant = require('ant-cycling-power')
      const pm = new ant.PowerMeter()
      let ts = 0
      let revCount = 0
      return function (event) {
        if ('watts' in event) {
          if (ts === 0) {
            ts = Date.now()
          } else {
            const now = Date.now()
            const delta = (now - ts) / 1000 / 60
            ts = now
            const revs = event.rev_count - revCount
            revCount = event.rev_count
            const cadence = Math.round(revs / delta)
            pm.broadcast(event.watts, cadence)
            ble.notify(event)
          }
        }
      }
    }

    mainUsb(listener, runMode === '--test' || process.env.TEST_MODE)
  }
}

main(process.argv)
