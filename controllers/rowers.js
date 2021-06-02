const { DateTime } = require('luxon')
const debug = require('debug')('home-rower-game:rower')
const models = require('../models')
const Rower = models.Rower

exports.getAll = async function (options) {
  const extras = {}
  if (typeof options === 'undefined') options = {}
  if (options.records) {
    if (extras.include) extras.include.push(models.Record)
    else extras.include = [models.Record]
    extras.include = [models.Record]
  }
  if (options.logbooks) {
    if (extras.include) extras.include.push(models.Logbook)
    else extras.include = [models.Logbook]
  }
  const rowers = await Rower.findAll(extras)
  let lastRowed
  for (let i = 0; i < rowers.length; i++) {
    if (rowers[i].lastRowed) {
      lastRowed = DateTime.fromJSDate(new Date(rowers[i].lastRowed))
      rowers[i].note = 'Last rowed ' + lastRowed.toRelative()
    } else {
      rowers[i].note = 'Has not rowed... yet.'
    }
    //
    if (options.excludeCheckpoints) {
      rowers[i].Records.forEach(function (record) {
        delete record.dataValues.checkpoints
      })
    }
    // if (!rowers[i].records) {
    //   rowers[i].records = {}
    //   if (process.env.DEV) {
    //     if (Math.random() > 0.5) {
    //       rowers[i].records.marathon = { time: 10000, distance: 10000 }
    //     }
    //     ['time5', 'time10', 'time15', 'time20', 'time30', 'time45', 'time60', 'length500', 'length1000', 'length2000', 'length5000', 'length6000', 'length10000'].forEach(function (key) {
    //       if (Math.random() > 0.5) {
    //         rowers[i].records[key] = { distance: 10000, time: 10000 }
    //       }
    //     })
    //   }
    // }
  }
  return rowers
}

exports.getById = async function (id, options) {
  const extras = {}
  if (typeof options === 'undefined') options = {}
  if (options.records) {
    if (extras.include) extras.include.push(models.Record)
    else extras.include = [models.Record]
    extras.include = [models.Record]
  }
  if (options.logbooks) {
    if (extras.include) extras.include.push(models.Logbook)
    else extras.include = [models.Logbook]
  }
  const rower = await Rower.findByPk(id, extras)
  if (options.excludeCheckpoints) {
    rower.Records.forEach(function (record) {
      delete record.dataValues.checkpoints
    })
  }
  return rower
}

exports.create = async function (doc) {
  return await Rower.create(doc)
}

exports.update = async function (doc, whereClause) {
  return await Rower.update(doc, { where: whereClause })
}
exports.saveRecording = async function (id, recording) {
  const rower = await exports.getById(id)
  let personalBest = false

  if (process.env.FAKE_ROWER && !process.env.SAVE_FAKE_RESULTS) {
    return personalBest
  }

  const update = {}
  update.lastRowed = new Date()
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
  await exports.update(update, { id: id })
  return personalBest
}

exports.deleteById = async function (id) {
  await Rower.destroy({ where: { id: id } })
}
