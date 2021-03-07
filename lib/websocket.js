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
        prevPos: 0.5
      },
      competitor: {
        distance: 0,
        prevPos: 0.5
      }
    }
    map.set(userId, ws)

    const rowerPosition = function () {
      const data = {
        rower: {
          speed: Math.round(Math.random() * 20),
          speedUnits: 'm/s'
        },
        competitor: {
          speed: Math.round(Math.random() * 20),
          speedUnits: 'm/s'
        }
      }
      raceStandings.rower.distance += Math.round(Math.random() * 10)
      if (raceStandings.rower.distance > 1000) {
        data.rower.distance = (raceStandings.rower.distance / 1000).toFixed(2)
        data.rower.distanceUnits = 'km'
      } else {
        data.rower.distance = raceStandings.rower.distance
        data.rower.distanceUnits = 'm'
      }
      raceStandings.competitor.distance += Math.round(Math.random() * 10)
      if (raceStandings.competitor.distance > 1000) {
        data.competitor.distance = (raceStandings.competitor.distance / 1000).toFixed(2)
        data.competitor.distanceUnits = 'km'
      } else {
        data.competitor.distance = raceStandings.competitor.distance
        data.competitor.distanceUnits = 'm'
      }

      // Distance decides who is above & by how much
      const distanceDiff = data.rower.distance - data.competitor.distance
      if (distanceDiff === raceStandings.distanceDiff) {
        data.rower.position = raceStandings.rower.prevPos
        data.competitor.position = raceStandings.competitor.prevPos
      } else if (distanceDiff > 0) {
        data.rower.position = 0.75
        data.competitor.position = 0.25
      } else if (distanceDiff < 0) {
        data.rower.position = 0.25
        data.competitor.position = 0.75
      } else {
        data.rower.position = 0.5
        data.competitor.position = 0.5
      }
      if (distanceDiff > raceStandings.distanceDiff) { // Rower is gaining ground
        data.rower.position += 0.1
      } else if (distanceDiff < raceStandings.distanceDiff) { // Competitor is gaining ground
        data.competitor.position += 0.1
      }

      // Speed change impacts adjustment to gap
      const speedDiff = data.rower.speed - data.competitor.speed
      if (distanceDiff !== 0) {
        let gapFactor
        if (distanceDiff > 0 && speedDiff < 0) { // Only adjust the gap if leader isn't gaining speed
          gapFactor = (data.rower.position - data.competitor.position) / 2
          data.competitor.position += gapFactor.toFixed(2)
        } else if (distanceDiff < 0 && speedDiff > 0) { // Only adjust the gap if leader isn't gaining speed
          gapFactor = (data.competitor.position - data.rower.position) / 2
          data.rower.position += gapFactor.toFixed(2)
        }
      }

      // If rowers are stuck, put them in the middle
      if ((data.rower.position > 0.9 && data.competitor.position > 0.9) || (data.rower.position < 0.1 && data.competitor.position < 0.1)) {
        data.rower.posiiton = 0.5
        data.competitor.posiiton = 0.5
      }

      raceStandings.rower.prevPos = data.rower.position
      raceStandings.competitor.prevPos = data.competitor.position
      raceStandings.distanceDiff = distanceDiff
      raceStandings.speedDiff = speedDiff
      ws.send(JSON.stringify(data), function () {})
    }

    ws.on('message', function (message) {
      console.log(`Received message ${message} from user ${userId}`)
    })

    const id = setInterval(rowerPosition, 1000 * 10)
    rowerPosition()

    ws.on('close', function () {
      map.delete(userId)
      clearInterval(id)
    })
  })
}
