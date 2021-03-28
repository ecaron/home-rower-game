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
    if (rower.record) {
      debug(`Comparing prev distance of ${rower.record.distance} to current distance of ${recording.distance}`)
    }
    if (!rower.record || parseInt(rower.record.distance, 10) < parseInt(recording.distance, 10)) {
      debug('A new record was set!')
      recording.duration = recording.checkpoints[recording.checkpoints.length - 1].time
      db.rowers.update({ _id: userId }, { $set: { record: recording } }, function (err) {
        if (err) debug(err)
        personalBest = {
          prevMaxSpeed: rower.record.maxSpeed,
          prevDistance: rower.record.distance,
          prevDuration: rower.record.duration
        }
        callback(personalBest)
      })
    } else {
      callback(personalBest)
    }
  })
}
