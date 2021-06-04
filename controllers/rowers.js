const { DateTime } = require('luxon')
const debug = require('debug')('home-rower-game:rower')
const models = require('../models')
const Rower = models.Rower
const Record = models.Record
const Logbook = models.Logbook

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
    // We support removing checkpoints to deduce data sent to browser
    if (options.excludeCheckpoints) {
      rowers[i].Records.forEach(function (record) {
        delete record.dataValues.checkpoints
      })
    }
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

  // We support removing checkpoints to deduce data sent to browser
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
exports.saveRecording = async function (id, results, recording) {
  const rower = await exports.getById(id)

  if (process.env.FAKE_ROWER && !process.env.SAVE_FAKE_RESULTS) {
    debug('Not processing the recording from this race')
  } else {
    const duration = recording.checkpoints[recording.checkpoints.length - 1].time - recording.checkpoints[0].time
    let finishedRace = false
    let raceValue
    if (recording.mode === 'marathon') {
      finishedRace = true
    } else if (recording.mode.substring(0, 4) === 'time') {
      raceValue = recording.mode.substring(4)
      finishedRace = duration >= raceValue * 60 * 1000
    } else if (recording.mode.substring(0, 6) === 'length') {
      raceValue = recording.mode.substring(6)
      finishedRace = recording.distance >= raceValue
    }
    results.finishedRace = finishedRace
    await Logbook.create({
      RowerId: rower.id,
      mode: recording.mode,
      maxSpeed: recording.maxSpeed,
      date: new Date(),
      duration: duration,
      competitor: recording.competitor,
      won: (results.winner === 'YOU'),
      distance: recording.distance,
      finished: finishedRace
    })
    if (finishedRace === true) {
      let isPersonalBest = false
      const record = await Record.findOne({ where: { RowerId: id, mode: recording.mode } })
      if (!record) {
        isPersonalBest = true
      } else if (recording.mode === 'marathon') {
        isPersonalBest = record.distance < recording.distance
      } else if (recording.mode.substring(0, 4) === 'time') {
        isPersonalBest = record.distance < recording.distance
      } else if (recording.mode.substring(0, 6) === 'length') {
        isPersonalBest = record.duration > recording.duration
      }
      results.isPersonalBest = isPersonalBest
      if (isPersonalBest === true) {
        if (!record) {
          // Determine if this race is a personal record for the rower
          await Record.create({
            RowerId: rower.id,
            mode: recording.mode,
            checkpoints: recording.checkpoints,
            start: recording.start,
            maxSpeed: recording.maxSpeed,
            distance: recording.distance,
            duration: duration,
            competitor: recording.competitor,
            won: (results.winner === 'YOU')
          })
        } else {
          results.prevPersonalBest = {
            maxSpeed: record.maxSpeed,
            distance: record.distance,
            duration: record.duration
          }

          record.checkpoints = recording.checkpoints
          record.start = recording.start
          record.maxSpeed = recording.maxSpeed
          record.duration = duration
          record.distance = recording.distance
          record.competitor = recording.competitor
          record.won = (results.winner === 'YOU')
          await record.save()
        }
      }
    }
  }
  rower.lastRowed = new Date()
  rower.recentRace = results
  await rower.save()
}

exports.deleteById = async function (id) {
  await Rower.destroy({ where: { id: id } })
}
