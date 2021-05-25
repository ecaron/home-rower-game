const express = require('express')
const router = express.Router()
const debug = require('debug')('home-rower-game:compete')

const db = require('../lib/db')
const S4 = require('../s4')

router.post('/', function (req, res) {
  req.session.competitor = req.body.competitor
  res.redirect('/compete')
})
router.get('/', async function (req, res) {
  if (!req.session.userId || !req.session.competitor) {
    return res.redirect('/')
  }
  const rowers = await db.rowers.findAll({ where: { id: [req.session.userId, req.session.competitor] } })
  const data = {}
  rowers.forEach(function (rower) {
    if (rower.id === req.session.userId) data.rower = rower
    if (rower.id === req.session.competitor) data.competitor = rower
  })
  if (data.competitor.record && data.competitor.record.maxSpeed && typeof data.competitor.record.maxSpeed !== 'string') {
    data.competitor.record.maxSpeed = data.competitor.record.maxSpeed.toFixed(2)
  }
  res.render('compete', data)
})

router.get('/memory.json', function (req, res) {
  if (process.env.FAKE_ROWER) {
    S4.memoryMap.forEach(response => {
      if (typeof response.value === 'undefined') response.value = 1
      else response.value++
    })
  }
  res.send(S4.memoryMap)
})
router.get('/reset.json', function (req, res) {
  S4.memoryMap.forEach(response => {
    response.value = 0
  })
  res.send({ status: 'success' })
})
router.get('/reset', function (req, res) {
  debug('Resetting memory state')
  S4.memoryMap.forEach(response => {
    response.value = 0
  })
  res.redirect('/')
})
router.get('/results', async function (req, res) {
  S4.rower.reset()
  const rower = await db.rowers.findByPk(req.session.userId)
  if (!rower.recentRace) {
    res.redirect('/')
    return
  }
  if (rower.recentRace.personalBest && typeof rower.recentRace.personalBest.prevMaxSpeed !== 'string') {
    rower.recentRace.personalBest.prevMaxSpeed = rower.recentRace.personalBest.prevMaxSpeed.toFixed(2)
  }
  if (rower.recentRace.rower && typeof rower.recentRace.rower.maxSpeed !== 'string') {
    rower.recentRace.rower.maxSpeed = rower.recentRace.rower.maxSpeed.toFixed(2)
  }
  if (rower.recentRace.competitor && typeof rower.recentRace.competitor.maxSpeed !== 'string') {
    rower.recentRace.competitor.maxSpeed = rower.recentRace.competitor.maxSpeed.toFixed(2)
  }
  res.render('results', rower.recentRace)
})

module.exports = router
