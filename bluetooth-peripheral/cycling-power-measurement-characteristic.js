const util = require('util')
const debug = require('debug')('pm')

const bleno = require('bleno')

const Descriptor = bleno.Descriptor
const Characteristic = bleno.Characteristic

// Spec
// https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.cycling_power_measurement.xml

const CyclingPowerMeasurementCharacteristic = function () {
  CyclingPowerMeasurementCharacteristic.super_.call(this, {
    uuid: '2A63',
    properties: ['notify'],
    descriptors: [
      new Descriptor({
        // Client Characteristic Configuration
        uuid: '2902',
        value: Buffer.allow([0])
      }),
      new Descriptor({
        // Server Characteristic Configuration
        uuid: '2903',
        value: Buffer.allow([0])
      })
    ]
  })

  this._updateValueCallback = null
}

util.inherits(CyclingPowerMeasurementCharacteristic, Characteristic)

CyclingPowerMeasurementCharacteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
  console.log('[BLE] client subscribed to PM')
  this._updateValueCallback = updateValueCallback
}

CyclingPowerMeasurementCharacteristic.prototype.onUnsubscribe = function () {
  console.log('[BLE] client unsubscribed from PM')
  this._updateValueCallback = null
}

CyclingPowerMeasurementCharacteristic.prototype.notify = function (event) {
  if (!('watts' in event) && !('rev_count' in event)) {
    // ignore events with no power and no crank data
    return
  }
  const buffer = Buffer.alloc(8)
  // flags
  // 00000001 - 1   - 0x001 - Pedal Power Balance Present
  // 00000010 - 2   - 0x002 - Pedal Power Balance Reference
  // 00000100 - 4   - 0x004 - Accumulated Torque Present
  // 00001000 - 8   - 0x008 - Accumulated Torque Source
  // 00010000 - 16  - 0x010 - Wheel Revolution Data Present
  // 00100000 - 32  - 0x020 - Crank Revolution Data Present
  // 01000000 - 64  - 0x040 - Extreme Force Magnitudes Present
  // 10000000 - 128 - 0x080 - Extreme Torque Magnitudes Present
  buffer.writeUInt16LE(0x020, 0)

  if ('watts' in event) {
    const watts = event.watts
    debug('power: ' + watts)
    buffer.writeInt16LE(watts, 2)
  }

  if ('rev_count' in event) {
    debug('rev_count: ' + event.rev_count)
    buffer.writeUInt16LE(event.rev_count, 4)

    const now = Date.now()
    const now1024 = Math.floor(now * 1e3 / 1024)
    const eventTime = now1024 % 65536 // rolls over every 64 seconds
    debug('event time: ' + eventTime)
    buffer.writeUInt16LE(eventTime, 6)
  }

  if (this._updateValueCallback) {
    this._updateValueCallback(buffer)
  }
}

module.exports = CyclingPowerMeasurementCharacteristic
