const debug = require('debug')('home-rower-game:rower')
const db = require('./db')

exports.saveRecording = async function (userId, recording, callback) {
  const rower = await db.rowers.findByPk(userId)
  let personalBest = false

  if (process.env.FAKE_ROWER && !process.env.SAVE_FAKE_RESULTS) {
    return callback(personalBest)
  }

  const update = {}
  if (!rower.record || parseInt(rower.record.distance, 10) < parseInt(recording.distance, 10)) {
    debug('A new record was set!')
    recording.duration = recording.checkpoints[recording.checkpoints.length - 1].time
    update.record = recording
    personalBest = {
      prevMaxSpeed: rower.record ? rower.record.maxSpeed : 0,
      prevDistance: rower.record ? rower.record.distance : 0,
      prevDuration: rower.record ? rower.record.duration : 0
    }
  }
  const logEntry = {
    duration: recording.checkpoints[recording.checkpoints.length - 1].time,
    distance: parseInt(recording.distance, 10),
    maxSpeed: recording.maxSpeed,
    date: recording.start
  }
  if (rower.logbook) {
    rower.logbook.push(logEntry)
    update.logbook = rower.logbook
  } else {
    update.logbook = [logEntry]
  }
  db.rowers.update(update, { where: { id: userId } }, function (err) {
    if (err) debug(err)
    callback(personalBest)
  })
}
