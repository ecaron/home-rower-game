const debug = require('debug')('waterrower-game:main')
const express = require('express')
const nunjucks = require('nunjucks')
const registerRouter = express.Router()
const modifyRouter = express.Router()
const db = require('../lib/db')
const websocket = require('../lib/websocket')
const S4 = require('../s4')

exports.home = function (req, res) {
  if (!process.env.FAKE_ROWER && !S4.rower.port) {
    res.render('rower-not-connected')
    return
  }
  db.rowers.find({}, function (err, rowers) {
    if (err) debug(err)
    if (req.session.userId) {
      res.render('index', { rowers: rowers })
    } else {
      res.render('login', { rowers: rowers })
    }
  })
}

exports.login = function (req, res) {
  req.session.userId = req.body.name
  res.redirect('/')
}
exports.logout = function (req, res) {
  websocket.logout(req.session.userId, function () {
    req.session.destroy(function () {
      res.send({ result: 'OK', message: 'Session destroyed' })
    })
  })
}

registerRouter.get('/', function (req, res) {
  if (req.session.userId) {
    debug('User tried to register, but was already logged in')
    res.redirect('/')
  } else {
    res.render('register')
  }
})
registerRouter.post('/', function (req, res) {
  if (req.body.useColor) {
    Object.keys(req.body.useColor).forEach(function (key) {
      req.body.avatar[key] = req.body.customColor[key]
    })
  }
  const doc = {
    name: req.body.name,
    avatar: req.body.avatar
  }

  db.rowers.insert(doc, function (err, newDoc) {
    if (err) debug(err)
    req.session.userId = req.body.name
    res.redirect('/')
  })
})
exports.register = registerRouter

modifyRouter.get('/:rower/logbook', function (req, res) {
  db.rowers.findOne({ _id: req.params.rower }, function (err, rower) {
    if (err) debug(err)
    const entries = []
    const daysAgo = {
      7: new Date() - (7 * 24 * 60 * 60 * 1000),
      30: new Date() - (30 * 24 * 60 * 60 * 1000)
    }
    if (rower.logbook && rower.logbook.length > 0) {
      entries.push({ key: 'All-Time', distance: 0, maxSpeed: 0, sessions: 0, show: true })
      for (let i = 0; i < rower.logbook.length; i++) {
        entries[0].sessions++
        entries[0].distance += rower.logbook[i].distance
        if (rower.logbook[i].maxSpeed > entries[0].maxSpeed) {
          entries[0].maxSpeed = rower.logbook[i].maxSpeed
        }
        if (rower.logbook[i].date > daysAgo[30]) {
          if (entries.length === 1) {
            entries.push({ key: 'Within 30 Days', distance: 0, maxSpeed: 0, sessions: 0, show: true })
          }
          entries[1].sessions++
          entries[1].distance += rower.logbook[i].distance
          if (rower.logbook[i].maxSpeed > entries[1].maxSpeed) {
            entries[1].maxSpeed = rower.logbook[i].maxSpeed
          }
        }
        if (rower.logbook[i].date > daysAgo[7]) {
          if (entries.length === 2) {
            entries.push({ key: 'Within 7 Days', distance: 0, maxSpeed: 0, sessions: 0, show: true })
          }
          entries[2].sessions++
          entries[2].distance += rower.logbook[i].distance
          if (rower.logbook[i].maxSpeed > entries[2].maxSpeed) {
            entries[2].maxSpeed = rower.logbook[i].maxSpeed
          }
        }
      }
      if (entries.length >= 3 && entries[2].sessions === entries[1].sessions) entries[1].show = false
      if (entries.length >= 3 && entries[2].sessions === entries[0].sessions) entries[0].show = false
      if (entries.length >= 2 && entries[1].sessions === entries[0].sessions) entries[0].show = false
    }
    res.send(nunjucks.render('partials/logbook.njk', { entries: entries, name: rower.name }))
  })
})
modifyRouter.get('/:rower', function (req, res) {
  db.rowers.findOne({ _id: req.params.rower }, function (err, rower) {
    if (err) debug(err)
    res.render('edit-rower', { rower: rower })
  })
})
modifyRouter.post('/:rower', function (req, res) {
  if (req.body.useColor) {
    Object.keys(req.body.useColor).forEach(function (key) {
      if (req.body.customColor[key]) {
        req.body.avatar[key] = req.body.customColor[key]
      }
    })
  }
  const doc = {
    name: req.body.name,
    avatar: req.body.avatar
  }

  db.rowers.update({ _id: req.params.rower }, { $set: doc }, function (err, newDoc) {
    if (err) debug(err)
    res.redirect('/')
  })
})
modifyRouter.delete('/:rower', function (req, res) {
  db.rowers.find({}, function (err, rowers) {
    if (err) debug(err)
    let activeRowerFound = false
    for (let i = 0; i < rowers.length; i++) {
      if (rowers[i]._id !== req.params.rower && rowers[i].record) {
        activeRowerFound = true
      }
    }
    if (activeRowerFound === false) {
      return res.json({ error: 'This rower cannot be deleted since it is the only one with a recorded session.' })
    }
    db.rowers.remove({ _id: req.params.rower }, {}, function () {
      return res.json({})
    })
  })
})
exports.modify = modifyRouter