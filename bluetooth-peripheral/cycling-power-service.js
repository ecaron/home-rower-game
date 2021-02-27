const util = require('util')
const bleno = require('@abandonware/bleno')

const BlenoPrimaryService = bleno.PrimaryService

const CyclingPowerMeasurementCharacteristic = require('./cycling-power-measurement-characteristic')
const CylingPowerFeatureCharacteristic = require('./cycling-power-feature-characteristic')
const CyclingSensorLocationCharacteristic = require('./cycling-sensor-location-characteristic')

// https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.cycling_power.xml
function CyclingPowerService () {
  this.pm = new CyclingPowerMeasurementCharacteristic()
  CyclingPowerService.super_.call(this, {
    uuid: '1818',
    characteristics: [
      this.pm,
      new CylingPowerFeatureCharacteristic(),
      new CyclingSensorLocationCharacteristic()
    ]
  })
  this.notify = function (event) {
    this.pm.notify(event)
  }
}

util.inherits(CyclingPowerService, BlenoPrimaryService)

module.exports = CyclingPowerService
