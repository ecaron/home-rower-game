const debug = require('debug')('waterrower-game:websocket')
const WebSocket = require('ws')
const map = new Map()
const wss = new WebSocket.Server({ clientTracking: false, noServer: true })

const S4 = require('../s4')

exports.logout = function (userId, callback) {
  const ws = map.get(userId)
  if (ws) ws.close()
  return callback()
}
exports.init = function (server, sessionParser) {
  server.on('upgrade', function (request, socket, head) {
    sessionParser(request, {}, () => {
      if (!request.session.userId) {
        debug('Websocket tried to connect without a valid session')
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request)
      })
    })
  })

  wss.on('connection', function (ws, request) {
    const userId = request.session.userId
    const raceStandings = {
      distanceDiff: 0,
      speedDiff: 0,
      rower: {
        distance: 0,
        speed: 0,
        prevPos: 0.5
      },
      competitor: {
        distance: 0,
        speed: 0,
        prevPos: 0.5
      }
    }
    map.set(userId, ws)

    const rowerPosition = function (target, speed, distance) {
      raceStandings[target].speed = speed
      raceStandings[target].distance += distance

      const data = {
        target: target,
        speed: speed,
        speedUnits: 'spm',
        distance: raceStandings[target].distance,
        position: {
          rower: 0.5,
          competitor: 0.5
        }
      }

      // Distance decides who is above & by how much
      const distanceDiff = raceStandings.rower.distance - raceStandings.competitor.distance
      if (distanceDiff === raceStandings.distanceDiff) {
        data.position.rower = raceStandings.rower.prevPos
        data.position.competitor = raceStandings.competitor.prevPos
      } else if (distanceDiff > 0) {
        data.position.rower = 0.75
        data.position.competitor = 0.25
      } else if (distanceDiff < 0) {
        data.position.rower = 0.25
        data.position.competitor = 0.75
      } else {
        data.position.rower = 0.5
        data.position.competitor = 0.5
      }
      if (distanceDiff > raceStandings.distanceDiff) { // Rower is gaining ground
        data.position.rower += 0.1
      } else if (distanceDiff < raceStandings.distanceDiff) { // Competitor is gaining ground
        data.position.competitor += 0.1
      }

      // Speed change impacts adjustment to gap
      const speedDiff = raceStandings.rower.speed - raceStandings.competitor.speed
      if (distanceDiff !== 0) {
        let gapFactor
        if (distanceDiff > 0 && speedDiff < 0) { // Only adjust the gap if leader isn't gaining speed
          gapFactor = (data.position.rower - data.position.competitor) / 2
          data.position.competitor += gapFactor.toFixed(2)
        } else if (distanceDiff < 0 && speedDiff > 0) { // Only adjust the gap if leader isn't gaining speed
          gapFactor = (data.position.competitor - data.position.rower) / 2
          data.position.rower += gapFactor.toFixed(2)
        }
      }

      // If rowers are stuck, put them in the middle
      if ((data.position.rower > 0.9 && data.position.competitor > 0.9) || (data.position.rower < 0.1 && data.position.competitor < 0.1)) {
        data.posiiton.rower = 0.5
        data.posiiton.competitor = 0.5
      }

      raceStandings.rower.prevPos = data.position.rower
      raceStandings.competitor.prevPos = data.position.competitor
      raceStandings.distanceDiff = distanceDiff
      raceStandings.speedDiff = speedDiff
      ws.send(JSON.stringify(data), function () {})
    }

    ws.on('message', function (message) {
      console.log(`Received message ${message} from user ${userId}`)
    })

    let rowerInterval, competitorInterval
    if (process.env.FAKE_ROWER) {
      rowerInterval = setInterval(function () {
        rowerPosition('rower', Math.round(Math.random() * 20), Math.round(Math.random() * 10))
      }, 1000 * 10)
      rowerPosition('rower', Math.round(Math.random() * 20), Math.round(Math.random() * 10))
      competitorInterval = setInterval(function () {
        rowerPosition('competitor', Math.round(Math.random() * 20), Math.round(Math.random() * 10))
      }, 1000 * 10)
      rowerPosition('competitor', Math.round(Math.random() * 20), Math.round(Math.random() * 10))
    } else {
      S4.rower.on('update', function (data) {
        console.log(data)
      })
    }

    ws.on('close', function () {
      map.delete(userId)
      if (rowerInterval) clearInterval(rowerInterval)
      if (competitorInterval) clearInterval(competitorInterval)
    })
  })
}
