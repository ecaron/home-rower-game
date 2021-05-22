const Rower = require('./rower')
const memoryMap = require('./memory-map')
const debug = require('debug')('waterrower-game:S4')
const rower = new Rower(memoryMap)

const init = async function () {
  const rowerPort = await rower.findPort()
  if (rowerPort !== false) {
    debug('[Init] Port is available - starting rower')
    rower.startRower(rowerPort)
  } else {
    debug('[Init] Rower not found. Trying again in 5 seconds')
    setTimeout(init, 5000)
  }
}

module.exports = {
  init: init,
  rower: rower,
  memoryMap: memoryMap
}
