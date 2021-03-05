const Rower = require('./rower')
const UsbPeripheral = require('./usb-peripheral')
const memoryMap = require('./memory-map')
const debug = require('debug')('waterrower-game:S4')

const mainUsb = async function (testMode) {
  const rower = new Rower(memoryMap)
  if (testMode) {
    return rower.fakeRower()
  }
  const rowerPort = await rower.findPort()
  if (rowerPort !== false) {
    return rower.startRower()
  }
  // wait till we get the right serial
  debug('[Init] Awaiting WaterRower S4.2 to be connected to USB port')

  // monitor USB attach and detach events
  const usbPeripheral = new UsbPeripheral()
  usbPeripheral.monitorWr(function () {
    rower.startRower()
  }, rower.stopRower(rower))
}

module.exports = {
  usb: mainUsb,
  memoryMap: memoryMap
}
