/* eslint quote-props: ["error", "consistent-as-needed"] */
const { EventEmitter } = require('events')
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const debug = require('debug')('waterrower-game:S4')

function S4 (memoryMap) {
  const self = this
  self.memoryMap = memoryMap
  self.event = new EventEmitter()
  self.port = null
  self.pending = []
  self.writer = null
  self.connected = false
  self.reconnecting = false

  const EOL = '\r\n' // CRLF 0x0D0A
  this.write = function (string) {
    self.pending.push(string)
  }

  this.flushNext = function () {
    if (self.pending.length === 0) {
      return
    }
    const string = self.pending.shift()
    if (self.port) {
      const buffer = Buffer.from(string + EOL)
      // debug('[OUT]: ' + buffer)
      self.port.write(buffer)
      if (string === 'RESET') self.event.emit('started')
    } else {
      debug('Communication port is not open - not sending data: ' + string)
    }
  }

  this.readAndDispatch = function (string) {
    // debug('[IN]: ' + string)
    const c = string.charAt(0)
    switch (c) {
      case '_':
        self.wrHandler(string)
        break
      case 'I':
        self.informationHandler(string)
        break
      case 'O':
        // ignore
        break
      case 'E':
        // ignore
        break
      case 'P':
        // ignore
        break
      case 'S':
        for (let i = 0; i < memoryMap.length; i++) {
          self.readMemoryAddress(memoryMap[i].address, memoryMap[i].size)
        }
        break
      default:
        self.unknownHandler(string)
    }
  }

  // handlers start
  this.unknownHandler = function (string) {
    debug('Unrecognized packet: ' + string)
  }

  this.wrHandler = function (string) {
    if (string === '_WR_') {
      self.write('IV?')
    } else {
      self.unknownHandler(string)
    }
  }

  this.informationHandler = function (string) {
    const c = string.charAt(1)
    switch (c) {
      case 'V':
        this.informationVersionHandler(string)
        break
      case 'D':
        this.memoryValueHandler(string)
        break
      default:
        self.unknownHandler(string)
    }
  }

  this.readMemoryAddress = function (address, size) {
    const cmd = 'IR' + size + address
    this.write(cmd)
  }

  this.informationVersionHandler = function (string) {
    // IV40210
    const model = string.charAt(2)
    const fwRevMajor = string.substring(3, 5)
    const fwRevMinor = string.substring(5, 7)
    const version = 'S' + model + ' ' + fwRevMajor + '.' + fwRevMinor
    // only log error, ignore version mismatch
    if (version !== 'S4 02.10') {
      debug('WaterRower monitor version mismatch - expected S4 02.10 but got ' + version)
    } else {
      debug('WaterRower ' + version)
    }
    this.reset()
  }

  this.memoryValueHandler = function (string) {
    const size = string.charAt(2)
    const address = string.substring(3, 6)
    let l
    switch (size) {
      case 'S':
        l = 1
        break
      case 'D':
        l = 2
        break
      case 'T':
        l = 3
        break
      default:
        this.unknownHandler(string)
        return
    }
    const end = 6 + 2 * l
    const dataPoint = memoryMap.find(element => element.address === address)
    let value = parseInt(string.substring(6, end), 16)
    if (dataPoint.multiple) {
      value = value * dataPoint.multiple
    }
    if (dataPoint.value !== value) {
      debug(`${dataPoint.name} changed from ${dataPoint.value} to ${value}`)
      dataPoint.value = value
      this.event.emit('update', dataPoint)
    }
    this.readMemoryAddress(address, size)
  }
  // handlers end
}

S4.prototype.toString = function () {
  return this.port.path
}

S4.prototype.findPort = async function () {
  let i
  const ports = await SerialPort.list()
  for (i = 0; i < ports.length; i++) {
    // https://usb-ids.gowdy.us/read/UD/04d8/000a
    if (ports[i].vendorId === '04d8' && ports[i].productId === '000a') {
      // port is an object literal with string values
      return ports[i].path
    }
  }
  debug('USB device not detected')
  return false
}

S4.prototype.reconnect = function () {
  this.connected = false
  if (this.reconnecting) {
    debug('Already trying to reconnect')
    return
  }
  debug('Attempting reconnect in 5s')
  this.reconnecting = setTimeout(this.open.bind(this), 5000)
}

S4.prototype.open = function () {
  const self = this
  clearTimeout(this.reconnecting)
  this.reconnecting = false
  self.port.open(function (err) {
    if (err) {
      debug('Error occorred opening connection. Attempting reconnect.')
      self.reconnect()
      return
    }

    // we can only write one message every .2s
    if (self.writer) {
      clearInterval(self.writer)
      if (self.pending.length > 0) self.reset()
    }
    self.writer = setInterval(self.flushNext, 200)

    debug('Connected successfully')
    self.connected = true
    self.write('USB')
  })
}

S4.prototype.reset = function () {
  this.pending = []
  this.write('RESET')
  this.memoryMap.forEach(response => {
    response.value = 0
  })
}

S4.prototype.exit = function () {
  this.event.emit('stopped')
  this.write('EXIT')
  this.pending = []
  if (this.writer) {
    clearInterval(this.writer)
  }
}

S4.prototype.startRower = function (comName) {
  if (!comName) {
    return false
  }
  const self = this
  this.port = new SerialPort(comName, { baudRate: 19600, autoOpen: false, lock: false })
  const parser = this.port.pipe(new Readline({ delimiter: '\r\n' }))
  parser.on('data', this.readAndDispatch)
  this.open()
  this.port.on('error', function (err) {
    debug('Port errored, trying to open again in 5 seconds')
    debug(err)
    self.reconnect()
  })
  this.port.on('close', function () {
    debug('Port was closed, trying again in 5 seconds')
    self.reconnect()
  })

  this.event.on('stopped', function () {
    debug('[End] Workout ended successfully ...')
  })

  this.event.on('update', function (event) {
    // debug(event)
  })
}

module.exports = S4
