const debug = require('debug')('home-rower-game:db')
const { Sequelize, DataTypes } = require('sequelize')
const path = require('path')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'db', 'rowers.sqlite')
})

const Rower = sequelize.define('rower', {
  name: DataTypes.TEXT,
  avatar: DataTypes.JSON,
  record: DataTypes.JSON,
  logbook: DataTypes.JSON
})

const init = async function () {
  await sequelize.sync()
  const rowers = await Rower.findAll()
  if (rowers.length > 0) return
  debug('First load. Rower needs to be created.')
  const doc = {
    name: 'Elisabeta',
    avatar: {
      accessories: '',
      clothing: 'blazerAndShirt',
      eyebrows: 'default',
      eyes: 'default',
      facialHair: 'default',
      mouth: 'default',
      skin: 'tanned',
      top: 'bun',
      hairColor: 'brown',
      hatColor: 'gray01',
      accessoriesColor: 'pastelRed',
      facialHairColor: 'blondeGolden',
      clothingColor: 'heather'
    },
    record: {
      start: new Date(),
      maxSpeed: 1.0,
      distance: 50,
      duration: 100000,
      checkpoints: []
    }
  }
  for (let i = 1; i <= 20; i++) {
    doc.record.checkpoints.push({ time: i * 1000 * 5, speed: 1, distance: i * 2.5 })
  }
  doc.logbook = [{
    duration: 100000,
    distance: 50,
    maxSpeed: 1.0,
    date: new Date()
  }]
  await Rower.create(doc)
}

module.exports = {
  rowers: Rower,
  init: init
}
