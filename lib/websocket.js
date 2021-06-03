const debug = require('debug')('home-rower-game:websocket')
const WebSocket = require('ws')
const map = new Map()
const wss = new WebSocket.Server({ clientTracking: false, noServer: true })

const S4 = require('../s4')
const Rowers = require('../controllers').rowers

exports.logout = function (userId, callback) {
  const ws = map.get(userId)
  if (ws) ws.close()
  return callback()
}

exports.init = async function (server, sessionParser) {
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

  wss.on('connection', async function (ws, req) {
    S4.rower.reset()
    const userId = req.session.userId
    req.session.recording = {
      start: new Date(),
      mode: req.session.mode,
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
      }
    }
    const results = {
      rower: {
        maxSpeed: 0,
        distance: 0,
        duration: 0
      }
    }
    if (req.session.competitor) {
      raceStandings.competitor = {
        distance: 0,
        speed: 0,
        prevPos: 0.5
      }
      results.competitor = {
        maxSpeed: 0,
        distance: 0,
        duration: 0
      }
    }

    map.set(userId, ws)

    const rowerPosition = function (target, update) {
      if (update.speed) raceStandings[target].speed = update.speed
      if (update.distance) raceStandings[target].distance = update.distance

      // Only update the interface when either rower has moved forward
      if (target === 'rower') {
        if (update.speed && req.session.recording.maxSpeed < update.speed) {
          req.session.recording.maxSpeed = update.speed
        }
        if (update.distance) {
          req.session.recording.distance = update.distance
        }
        // Don't save checkpoints until we have a first speed & distance
        if (req.session.recording.maxSpeed === 0 || req.session.recording.distance === 0) {
          return
        }
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
        speedUnits: 'knots',
        distance: raceStandings[target].distance,
        position: {
          rower: 0.5,
          competitor: 0.5
        }
      }

      // Distance decides who is above & by how much
      if (req.session.competitor) {
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
            data.position.competitor += gapFactor
          } else if (distanceDiff < 0 && speedDiff > 0) { // Only adjust the gap if leader isn't gaining speed
            gapFactor = (data.position.competitor - data.position.rower) / 2
            data.position.rower += gapFactor
          }
        }

        // If rowers are stuck, put them in the middle
        if ((data.position.rower > 0.9 && data.position.competitor > 0.9) || (data.position.rower < 0.1 && data.position.competitor < 0.1)) {
          data.position.rower = 0.5
          data.position.competitor = 0.5
        }
        raceStandings.rower.prevPos = data.position.rower
        raceStandings.competitor.prevPos = data.position.competitor
        raceStandings.distanceDiff = distanceDiff
        raceStandings.speedDiff = speedDiff
      }

      // debug(`Sending ${JSON.stringify(data)}`)
      ws.send(JSON.stringify(data), function () {})
    }

    ws.on('message', async function (message) {
      const data = JSON.parse(message)
      if (data.status === 'end') {
        const personalBest = await Rowers.saveRecording(userId, req.session.recording)
        if (req.session.recording.maxSpeed) {
          results.rower = {
            maxSpeed: req.session.recording.maxSpeed,
            distance: req.session.recording.distance,
            duration: req.session.recording.checkpoints[req.session.recording.checkpoints.length - 1].time - req.session.recording.checkpoints[0].time
          }
        }
        if (req.session.competitor) {
          results.winner = 'THEM'
          if (req.session.mode.substring(0, 6) !== 'length' && parseInt(results.rower.distance, 10) >= parseInt(results.competitor.distance, 10)) {
            results.winner = 'YOU'
          } else if (req.session.mode.substring(0, 6) === 'length' && parseInt(results.rower.duration, 10) >= parseInt(results.competitor.duration, 10)) {
            results.winner = 'YOU'
          }
        }
        results.personalBest = personalBest
        await Rowers.update({ recentRace: results }, { id: req.session.userId })
        debug(`Saved results of ${JSON.stringify(results)}`)
      }
    })

    let rowerInterval, competitorInterval
    let rowerDistance = Math.round(Math.random() * 10)
    let competitorDistance = Math.round(Math.random() * 10)
    if (process.env.FAKE_ROWER) {
      rowerInterval = setInterval(function () {
        rowerDistance += Math.round(Math.random() * 10)
        rowerPosition('rower', { speed: Math.round(Math.random() * 10), distance: rowerDistance })
      }, 1000 * 10)
      rowerPosition('rower', { speed: Math.round(Math.random() * 10), distance: rowerDistance })
      ws.send(JSON.stringify({ status: 'start' }), function () {})
    } else {
      S4.rower.event.on('started', function () {
        ws.send(JSON.stringify({ status: 'start' }), function () {})
      })

      S4.rower.event.on('update', function (data) {
        if (data.name === 'ms_distance') rowerPosition('rower', { distance: data.value })
        if (data.name === 'ms_average') rowerPosition('rower', { speed: data.value })
      })
    }
    if (req.session.competitor) {
      const competitor = await Rowers.getById(req.session.competitor)
      if (competitor.record) {
        results.competitor = {
          maxSpeed: competitor.record.maxSpeed,
          distance: competitor.record.distance,
          duration: competitor.record.checkpoints[competitor.record.checkpoints.length - 1].time - competitor.record.checkpoints[0].time
        }
        const moveCompetitor = function () {
          const checkpoint = competitor.record.checkpoints.shift()
          rowerPosition('competitor', { speed: checkpoint.speed, distance: checkpoint.distance })
          if (competitor.record.checkpoints.length > 0) {
            setTimeout(moveCompetitor, competitor.record.checkpoints[0].time - checkpoint.time)
          } else {
            ws.send(JSON.stringify({ status: 'competitorDone' }), function () {})
          }
        }
        setTimeout(moveCompetitor, competitor.record.checkpoints[0].time)
      } else {
        competitorInterval = setInterval(function () {
          competitorDistance += Math.round(Math.random() * 10)
          rowerPosition('competitor', { speed: Math.round(Math.random() * 20), distance: competitorDistance })
        }, 1000 * 10)
        rowerPosition('competitor', { speed: Math.round(Math.random() * 20), distance: competitorDistance })
      }
    }

    ws.on('close', function () {
      map.delete(userId)
      if (rowerInterval) clearInterval(rowerInterval)
      if (competitorInterval) clearInterval(competitorInterval)
    })
  })
}
