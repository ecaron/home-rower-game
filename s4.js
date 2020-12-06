const com = require('serialport')
const debug = require('debug')('S4')

// MESSAGE FLOW
//
// send USB packet
// receive _WR_ packet
// send IV? packet
// receive IV packet (and check)
// send RESET packet
// receive PING packet
// send WSI or WSU packet (distance or duration)
// receive SS packet
// send IRS/IRD/IRT for all required memory addresses
// receive IDS/IDD/IDT with memory address value
// re-send corresponding IRS/IRD/IRT
// this.event is a promise:
//      resolve  -> completed successfully (string)
//      reject   -> not completed / failed (string)
//      notify   -> update for each event (memory address) (event object literal)
function S4 () {
  const self = this
  self.port = null
  self.pending = []
  self.writer = null
  // POSSIBLE STATES
  //
  //    Unset             = 0
  //    ResetWaitingPing  = 1
  //    ResetPingReceived = 2
  //    WorkoutStarted    = 3
  //    WorkoutCompleted  = 4
  //    WorkoutExited     = 5
  //
  self.state = 0
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
      debug('[OUT]: ' + buffer)
      self.port.write(buffer)
    } else {
      debug('Communication port is not open - not sending data: ' + string)
    }
  }

  this.readAndDispatch = function (string) {
    debug('[IN]: ' + string)
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
        break
      case 'P':
        self.pHandler(string)
        break
      case 'S':
        self.strokeHandler(string)
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

  this.pHandler = function (string) {
    const c = string.charAt(1)
    switch (c) {
      case 'I':
        if (this.state === 1) { // ResetWaitingPing
          this.state = 2 // ResetPingReceived
        }
        break
      default:
            // TODO consume PULSE event
    }
  }

  this.strokeHandler = function (string) {
    const c = string.charAt(1)
    switch (c) {
      case 'S':
        this.strokeStartHandler()
        break
      case 'E':
        // TODO this.strokeEndHandler(string);
        break
      default:
        self.unknownHandler(string)
    }
  }

  const memoryMap = {
    '1A9': ['stroke_rate', 'S'],
    140: ['stroke_count', 'D'],
    '088': ['watts', 'D']
  }

  this.strokeStartHandler = function () {
    if (this.state === 2) { // ResetPingReceived
      this.state = 3 // WorkoutStarted+++
      for (const address in memoryMap) {
        if ({}.hasOwnProperty.call(memoryMap, address)) {
          const element = memoryMap[address]
          self.readMemoryAddress(address, element[1])
        }
      }
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
    this.state = 1 // ResetWaitingPing
    this.write('RESET')
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
    const value = parseInt(string.substring(6, end), 16)
    const label = memoryMap[address][0]
    const e = {}
    e[label] = value
    if (self.event) {
      self.event.notify(e)
    }
    if (this.state === 3) { // WorkoutStarted
      this.readMemoryAddress(address, size)
    }
  }
  // handlers end
}

S4.prototype.toString = function () {
  return this.port.comName
}

S4.prototype.findPort = async function () {
  com.list(function (err, ports) {
    if (err) {
      throw err
    }

    let port = false
    ports.forEach(function (p) {
      // https://usb-ids.gowdy.us/read/UD/04d8/000a
      if (p.vendorId === '0x04d8' && p.productId === '0x000a') {
        // port is an object literal with string values
        port = p
      }
    })
    if (port) {
      return port.comName
    } else {
      debug('Prolific USB CDC RS-232 Serial Emulation port not found')
      return false
    }
  })
}

S4.prototype.open = async function (comName) {
  const self = this
  const port = new com.SerialPort(comName, {
    baudrate: 115200,
    parser: com.parsers.readline('\r\n')
  }, false)
  port.open(function () {
    self.port = port
    port.on('data', self.readAndDispatch)
    // we can only write one message every 25ms
    self.writer = setInterval(self.flushNext, 25)
    return true
  })
}

S4.prototype.start = async function () {
  this.write('USB')
}

S4.prototype.exit = function () {
  if (this.state !== 5) { // WorkoutExited
    this.state = 5
    this.write('EXIT')
    this.pending = []
    if (this.writer) {
      clearInterval(this.writer)
    }
    if (this.event) {
      this.event.resolve('EXITED')
    }
  }
}

S4.prototype.startRower = async function (callback) {
  const rower = this
  let comName
  try {
    comName = await rower.findPort()
  } catch (e) {
    debug('[Init] error: ' + e)
  }
  debug('[Init] Found WaterRower S4 on com port: ' + comName)
  let strokeCount = 0
  let watts = 0
  rower.open(comName).then(function () {
    debug('[Start] Start broadcasing WR data')
    rower.start().then(function (string) {
      debug('[End] Workout ended successfully ...' + string)
    }, function (string) {
      debug('[End] Workout failed ...' + string)
    }, function (event) {
      if ('stroke_rate' in event) {
        // No action necessary
      } else if ('stroke_count' in event && event.stroke_count > strokeCount) {
        strokeCount = event.stroke_count
        const e = {
          watts: watts,
          rev_count: strokeCount
        }
        callback(e)
      } else if ('watts' in event) {
        if (event.watts > 0) {
          watts = event.watts
        }
      }
    })
  })
}

S4.prototype.stopRower = function () {
  const self = this
  return function () {
    self.exit()
  }
}

S4.prototype.fakeRower = function (callback) {
  debug('[Init] Faking test data')
  let strokeCount = 0
  const test = function () {
    const watts = Math.floor(Math.random() * 10 + 120)
    const error = false
    strokeCount = strokeCount + 1
    callback(error, { watts: watts, rev_count: strokeCount })
    setTimeout(test, 666)
  }
  test()
}

module.exports = S4
