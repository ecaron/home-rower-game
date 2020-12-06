const usb = require('usb')
const debug = require('debug')('usb')

const UsbPeripheral = function () {
  this.monitorWr = function (startRower, stopRower) {
    const wrUsbEvent = function (device) {
      if (!device) {
        return false
      }

      debug('[USB] Device, ' +
                  'Vendor id: ' + device.deviceDescriptor.idVendor +
                  ', Product id: ', device.deviceDescriptor.idProduct)
      if (device.deviceDescriptor.idVendor === 0x04d8 &&
          device.deviceDescriptor.idProduct === 0x000a) {
        return true
      }

      return false
    }

    usb.on('attach', function (device) {
      if (wrUsbEvent(device)) {
        debug('[Init] WaterRower-S4.2 Connected to USB hub controller')
        startRower()
      }
    })

    usb.on('detach', function (device) {
      if (wrUsbEvent(device)) {
        debug('[End] WaterRower-S4.2 Disconnected from USB hub controller')
        stopRower()
      }
    })
  }
}

module.exports.UsbPeripheral = UsbPeripheral
