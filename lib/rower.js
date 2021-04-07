const debug = require('debug')('waterrower-game:rower')
const db = require('./db')

exports.saveRecording = function (userId, recording, callback) {
  db.rowers.findOne({ _id: userId }, function (err, rower) {
    let personalBest = false
    if (err) {
      debug(err)
      return callback(personalBest)
    }

    if (process.env.FAKE_ROWER && !process.env.SAVE_FAKE_RESULTS) {
      return callback(personalBest)
    }

    const update = { $set: {} }
    if (!rower.record || parseInt(rower.record.distance, 10) < parseInt(recording.distance, 10)) {
      debug('A new record was set!')
      recording.duration = recording.checkpoints[recording.checkpoints.length - 1].time
      update.$set.record = recording
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
      update.$set.logbook = rower.logbook
    } else {
      update.$set.logbook = [logEntry]
    }
    db.rowers.update({ _id: userId }, update, function (err) {
      if (err) debug(err)
      callback(personalBest)
    })
  })
}
