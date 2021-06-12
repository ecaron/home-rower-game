const express = require('express')
const router = express.Router()
const debug = require('debug')('home-rower-game:compete')

const Rowers = require('../controllers').rowers
const S4 = require('../s4')

router.post('/', function (req, res) {
  req.session.competitor = req.body.competitor
  req.session.mode = req.body.mode
  res.redirect('/compete')
})
router.get('/', async function (req, res) {
  if (!req.session.userId) {
    return res.redirect('/')
  }

  const data = {
    rower: await Rowers.getById(req.session.userId, { records: true }),
    mode: req.session.mode
  }

  if (req.session.competitor) {
    if (req.session.userId === req.session.competitor) {
      data.competitor = data.rower
    } else {
      data.competitor = await Rowers.getById(req.session.competitor, { records: true })
    }
    if (data.competitor.Records) {
      data.competitor.record = data.competitor.Records.find(element => element.mode === req.session.mode)
      if (data.competitor.record && data.competitor.record.maxSpeed && typeof data.competitor.record.maxSpeed !== 'string') {
        data.competitor.record.maxSpeed = parseFloat(data.competitor.record.maxSpeed.toFixed(2))
      }
    }
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
  const rower = await Rowers.getById(req.session.userId)
  if (!rower.recentRace) {
    debug('Got to results before recentRace was saved')
    res.redirect('/')
    return
  }
  if (rower.recentRace.isPersonalBest && rower.recentRace.prevPersonalBest && typeof rower.recentRace.prevPersonalBest.maxSpeed !== 'string') {
    rower.recentRace.prevPersonalBest.maxSpeed = parseFloat(rower.recentRace.prevPersonalBest.maxSpeed.toFixed(2))
  }
  if (rower.recentRace.rower && typeof rower.recentRace.rower.maxSpeed !== 'string') {
    rower.recentRace.rower.maxSpeed = parseFloat(rower.recentRace.rower.maxSpeed.toFixed(2))
  }
  if (rower.recentRace.competitor && typeof rower.recentRace.competitor.maxSpeed !== 'string') {
    rower.recentRace.competitor.maxSpeed = parseFloat(rower.recentRace.competitor.maxSpeed.toFixed(2))
  }
  res.render('results', rower.recentRace)
})

module.exports = router
