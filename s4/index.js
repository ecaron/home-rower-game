const Rower = require('./rower')
const UsbPeripheral = require('./usb-peripheral')
const memoryMap = require('./memory-map')
const debug = require('debug')('waterrower-game:S4')
const rower = new Rower(memoryMap)

const init = async function () {
  const rowerPort = await rower.findPort()
  if (rowerPort !== false) {
    debug('[Init] Port is available - starting rower')
    rower.startRower()
    return
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
  init: init,
  rower: rower,
  memoryMap: memoryMap
}
