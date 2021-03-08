const debug = require('debug')('waterrower-game:websocket')
const WebSocket = require('ws')
const map = new Map()
const wss = new WebSocket.Server({ clientTracking: false, noServer: true })

const S4 = require('../s4')
const rower = require('./rower')
const db = require('./db')

exports.logout = function (userId, callback) {
  const ws = map.get(userId)
  if (ws) ws.close()
  return callback()
}
exports.init = function (server, sessionParser) {
  server.on('upgrade', function (req, socket, head) {
    sessionParser(req, {}, () => {
      if (!req.session.userId) {
        debug('Websocket tried to connect without a valid session')
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      wss.handleUpgrade(req, socket, head, function (ws) {
        wss.emit('connection', ws, req)
      })
    })
  })

  wss.on('connection', function (ws, req) {
    const userId = req.session.userId
    req.session.recording = {
      start: new Date(),
      maxSpeed: 0,
      distance: 0,
      checkpoints: []
    }
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

    const rowerPosition = function (target, metric, value) {
      raceStandings[target][metric] = value
      // Only update the interface when either rower has moved forward
      if (metric === 'speed') {
        if (target === 'rower' && req.session.recording.maxSpeed < value) {
          req.session.recording.maxSpeed = value
        }
        return
      }
      if (target === 'rower' && req.session.recording) {
        req.session.recording.distance = value
        if (!req.session.recording.checkpoints) req.session.recording.checkpoints = []
        req.session.recording.checkpoints.push({
          time: new Date() - req.session.recording.start,
          speed: raceStandings.rower.speed,
          distance: raceStandings.rower.distance
        })
      }

      const data = {
        status: 'update',
        target: target,
        speed: raceStandings[target].speed,
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
      const data = JSON.parse(message)
      if (data.status === 'end') {
        rower.saveRecording(userId, req.session.recording, function () {
          req.session.recording = false
        })
      }
    })

    let rowerInterval, competitorInterval
    let rowerDistance = Math.round(Math.random() * 10); let competitorDistance = Math.round(Math.random() * 10)
    if (process.env.FAKE_ROWER) {
      rowerInterval = setInterval(function () {
        rowerPosition('rower', 'speed', Math.round(Math.random() * 10))
        rowerDistance += Math.round(Math.random() * 10)
        rowerPosition('rower', 'distance', rowerDistance)
      }, 1000 * 10)
      rowerPosition('rower', 'speed', Math.round(Math.random() * 20))
      rowerPosition('rower', 'distance', rowerDistance)
    } else {
      S4.rower.event.on('update', function (data) {
        if (data.name === 'ms_distance') rowerPosition('rower', 'distance', data.value)
        if (data.name === 'stroke_rate') rowerPosition('rower', 'speed', data.value)
      })
    }
    db.rowers.findOne({ _id: req.session.competitor }, function (err, competitor) {
      if (err) {
        debug(err)
      }
      if (competitor.record) {
        const moveCompetitor = function () {
          const checkpoint = competitor.record.checkpoints.shift()
          rowerPosition('competitor', 'speed', checkpoint.speed)
          rowerPosition('competitor', 'distance', checkpoint.distance)
          if (competitor.record.checkpoints.length > 0) {
            setTimeout(moveCompetitor, competitor.record.checkpoints[0].time)
          } else {
            ws.send(JSON.stringify({ status: 'competitorDone' }), function () {})
          }
        }
        setTimeout(moveCompetitor, competitor.record.checkpoints[0].time)
      } else {
        competitorInterval = setInterval(function () {
          rowerPosition('competitor', 'speed', Math.round(Math.random() * 20))
          competitorDistance += Math.round(Math.random() * 10)
          rowerPosition('competitor', 'distance', competitorDistance)
        }, 1000 * 10)
        rowerPosition('competitor', 'speed', Math.round(Math.random() * 20))
        rowerPosition('competitor', 'distance', competitorDistance)
      }
    })

    ws.on('close', function () {
      map.delete(userId)
      if (rowerInterval) clearInterval(rowerInterval)
      if (competitorInterval) clearInterval(competitorInterval)
    })
  })
}
