const PORT = 5007
const dgram = require('dgram')
const debug = require('debug')('network')

const MessageListener = function (callback) {
  this.callback = callback
  this.client = dgram.createSocket('udp4')
  this.last_id = 0
}

MessageListener.prototype.start = function () {
  const self = this

  self.client.on('listening', function () {
    const address = self.client.address()
    debug('UDP Client listening on ' + address.address + ':' + address.port)
    self.client.setBroadcast(true)
    self.client.setMulticastTTL(128)
    self.client.addMembership('224.0.0.1')
  })

  self.client.on('message', function (message, remote) {
    debug('[IN] ' + remote.address + ':' + remote.port + ' - ' + message)

    const event = JSON.parse(message)
    if (event.id > self.last_id) {
      self.last_id = event.id
    } else {
      return
    }

    self.callback(event)
  })

  self.client.bind(PORT)
}

module.exports.MessageListener = MessageListener

const MessageBroadcaster = function () {
  this.server = dgram.createSocket('udp4')
  this.last_id = Date.now()
  const self = this
  this.start = function () {
    self.server.bind(function () {
      self.server.setBroadcast(true)
      self.server.setMulticastTTL(128)
    })
  }
  this.send = function (event) {
    event.id = self.last_id++
    const str = JSON.stringify(event)
    const message = Buffer.from(str)
    self.server.send(message, 0, message.length, 5007, '224.0.0.1')
    debug('[OUT] 224.0.0.1:5007 - ' + message)
  }
}

module.exports.MessageBroadcaster = MessageBroadcaster
