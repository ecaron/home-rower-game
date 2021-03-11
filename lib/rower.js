const debug = require('debug')('waterrower-game:rower')
const db = require('./db')

exports.saveRecording = function (userId, recording, callback) {
  db.rowers.findOne({ _id: userId }, function (err, rower) {
    if (err) {
      debug(err)
    }
    if (process.env.FAKE_ROWER && !process.env.SAVE_FAKE_RESULTS) {
      return callback()
    }
    if (!rower.record || rower.record.distance < recording.distance) {
      recording.duration = recording.checkpoints[recording.checkpoints.length - 1].time
      db.rowers.update({ _id: userId }, { $set: { record: recording } }, function (err) {
        if (err) debug(err)
        callback()
      })
    } else {
      callback()
    }
  })
}
