const debug = require('debug')('waterrower-game:main')
const express = require('express')
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
exports.modify = modifyRouter
