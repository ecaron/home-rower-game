const debug = require('debug')('waterrower-game:db')
const Datastore = require('nedb')
const path = require('path')

const rowers = new Datastore({ filename: path.join(__dirname, '..', 'db', 'rowers'), autoload: true })

const init = function () {
  return new Promise((resolve, reject) => {
    rowers.find({}, function (err, rowerEntries) {
      if (err) {
        return reject(err)
      }
      if (rowerEntries.length > 0) {
        return resolve()
      }
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
      rowers.insert(doc, function (err, newDoc) {
        if (err) debug(err)
        resolve()
      })
    })
  })
}

module.exports = {
  rowers: rowers,
  init: init
}
