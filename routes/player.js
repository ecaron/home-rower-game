const debug = require('debug')('waterrower-game:main')
const express = require('express')
const registerRouter = express.Router()
const modifyRouter = express.Router()
const db = require('../lib/db')
const websocket = require('../lib/websocket')

exports.home = function (req, res) {
  db.rowers.find({}, function (err, docs) {
    if (err) debug(err)
    if (req.session.userId) {
      res.render('index', { rowers: docs })
    } else {
      res.render('login', { rowers: docs })
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
  db.rowers.findOne({ name: req.params.rower }, function (err, rower) {
    if (err) debug(err)
    res.render('edit-rower', { rower: rower })
  })
})
modifyRouter.post('/:rower', function (req, res) {
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
exports.modify = modifyRouter
