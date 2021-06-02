const debug = require('debug')('home-rower-game:main')
const express = require('express')
const nunjucks = require('nunjucks')
const registerRouter = express.Router()
const modifyRouter = express.Router()
const Rowers = require('../controllers').rowers
const websocket = require('../lib/websocket')

exports.home = async function (req, res) {
  const rowers = await Rowers.getAll({ records: true, excludeCheckpoints: true })
  if (req.session.userId) {
    res.render('select-mode', { rowers })
  } else {
    res.render('login', { rowers })
  }
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
    res.render('edit-rower')
  }
})
registerRouter.post('/', async function (req, res) {
  if (req.body.useColor) {
    Object.keys(req.body.useColor).forEach(function (key) {
      req.body.avatar[key] = req.body.customColor[key]
    })
  }
  const doc = {
    name: req.body.name,
    avatar: req.body.avatar
  }

  await Rowers.create(doc)
  req.session.userId = req.body.name
  res.redirect('/')
})
exports.register = registerRouter

modifyRouter.get('/:rower/logbook', async function (req, res) {
  const rower = await Rowers.getById(req.params.rower, { records: true, logbooks: true, excludeCheckpoints: true })
  const entries = []
  const daysAgo = {
    7: new Date() - (7 * 24 * 60 * 60 * 1000),
    30: new Date() - (30 * 24 * 60 * 60 * 1000)
  }
  console.log()

  if (rower.Logbooks && rower.Logbooks.length > 0) {
    entries.push({ key: 'All-Time', distance: 0, maxSpeed: 0, sessions: 0, show: true })
    for (let i = 0; i < rower.Logbooks.length; i++) {
      if (req.query.mode && req.query.mode !== rower.Logbooks[i].mode) continue
      entries[0].sessions++
      entries[0].distance += rower.Logbooks[i].distance
      if (rower.Logbooks[i].maxSpeed > entries[0].maxSpeed) {
        entries[0].maxSpeed = rower.Logbooks[i].maxSpeed
      }
      if (rower.Logbooks[i].date > daysAgo[30]) {
        if (entries.length === 1) {
          entries.push({ key: 'Within 30 Days', distance: 0, maxSpeed: 0, sessions: 0, show: true })
        }
        entries[1].sessions++
        entries[1].distance += rower.Logbooks[i].distance
        if (rower.Logbooks[i].maxSpeed > entries[1].maxSpeed) {
          entries[1].maxSpeed = rower.Logbooks[i].maxSpeed
        }
      }
      if (rower.Logbooks[i].date > daysAgo[7]) {
        if (entries.length === 2) {
          entries.push({ key: 'Within 7 Days', distance: 0, maxSpeed: 0, sessions: 0, show: true })
        }
        entries[2].sessions++
        entries[2].distance += rower.Logbooks[i].distance
        if (rower.Logbooks[i].maxSpeed > entries[2].maxSpeed) {
          entries[2].maxSpeed = rower.Logbooks[i].maxSpeed
        }
      }
    }
    if (entries.length >= 3 && entries[2].sessions === entries[1].sessions) entries[1].show = false
    if (entries.length >= 3 && entries[2].sessions === entries[0].sessions) entries[0].show = false
    if (entries.length >= 2 && entries[1].sessions === entries[0].sessions) entries[0].show = false
    for (let i = 0; i < entries.length; i++) {
      entries[i].maxSpeed = entries[i].maxSpeed.toFixed(2)
    }
  }
  res.send(nunjucks.render('partials/logbook.njk', { entries: entries, name: rower.name }))
})
modifyRouter.get('/:rower', async function (req, res) {
  const rower = await Rowers.getById(req.params.rower)
  res.render('edit-rower', { rower: rower })
})

modifyRouter.post('/:rower', async function (req, res) {
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

  await Rowers.update(doc, { id: req.params.rower })
  res.redirect('/')
})

modifyRouter.delete('/:rower', async function (req, res) {
  const rowers = await Rowers.getAll()
  let activeRowerFound = false
  for (let i = 0; i < rowers.length; i++) {
    if (rowers[i].id !== req.params.rower && rowers[i].record) {
      activeRowerFound = true
    }
  }
  if (activeRowerFound === false) {
    return res.json({ error: 'This rower cannot be deleted since it is the only one with a recorded session.' })
  }
  await Rowers.deleteById(req.params.rower)
  return res.json({})
})
exports.modify = modifyRouter
