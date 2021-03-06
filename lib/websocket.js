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
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      debug('Session is parsed!')

      wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request)
      })
    })
  })

  wss.on('connection', function (ws, request) {
    const userId = request.session.userId

    map.set(userId, ws)

    ws.on('message', function (message) {
      //
      // Here we can now use session parameters.
      //
      console.log(`Received message ${message} from user ${userId}`)
    })

    ws.on('close', function () {
      map.delete(userId)
    })
  })
}
