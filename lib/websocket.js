const debug = require('debug')('waterrower-game:websocket')
const WebSocket = require('ws')
const map = new Map()
const wss = new WebSocket.Server({ clientTracking: false, noServer: true })

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
      rower: {
        distance: 0
      },
      competitor: {
        distance: 0
      }
    }
    map.set(userId, ws)

    const rowerPosition = function () {
      const data = {
        rower: {
          speed: Math.round(Math.random() * 20),
          speedUnits: 'm/s',
          position: 0.5
        },
        competitor: {
          speed: Math.round(Math.random() * 20),
          speedUnits: 'm/s',
          position: 0.5
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
