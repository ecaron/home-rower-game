'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const doc = {
      name: 'Elisabeta',
      avatar: JSON.stringify({
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
      }),
      recentRace: JSON.stringify({}),
      lastRowed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      totalDistance: 0
    }
    await queryInterface.bulkInsert('Rowers', [doc])
    const rowers = await queryInterface.sequelize.query('SELECT id from ROWERS')
    let rowerDistance = 0
    let duration = 0
    let distance = 0
    let checkpoints = []
    let i, j, mode

    const modes = ['marathon', 'time5', 'time10', 'time15', 'time20', 'time30', 'time45', 'time60', 'length500', 'length1000', 'length2000', 'length5000', 'length6000', 'length10000']
    const logbooks = []
    const records = []
    for (i = 0; i < modes.length; i++) {
      mode = modes[i]
      checkpoints = []
      if (mode === 'marathon') {
        duration = 15 * 60 * 1000
        distance = 100 * 15
      } else if (mode.substring(0, 4) === 'time') {
        duration = parseInt(mode.substring(4)) * 60 * 1000
        distance = 100 * parseInt(mode.substring(4))
      } else {
        duration = (parseInt(mode.substring(6)) / 100) * 60 * 1000
        distance = parseInt(mode.substring(6))
      }
      rowerDistance += distance

      for (j = 1; j <= duration / 60000; j++) {
        checkpoints.push({ time: j * 60000, speed: 1, distance: j * 100 })
      }

      records.push({
        RowerId: rowers[0][0].id,
        mode: mode,
        start: new Date(),
        maxSpeed: 1,
        checkpoints: JSON.stringify(checkpoints),
        distance: distance,
        duration: duration,
        competitor: false,
        won: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      logbooks.push({
        RowerId: rowers[0][0].id,
        mode: mode,
        duration: duration,
        distance: distance,
        maxSpeed: 1,
        date: new Date(),
        finished: true,
        competitor: false,
        won: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    try {
      await queryInterface.bulkInsert('Logbooks', logbooks)
      await queryInterface.bulkInsert('Records', records)
      await queryInterface.bulkUpdate('Rowers', {
        totalDistance: rowerDistance
      }, {
        id: rowers[0][0].id
      })
    } catch (e) {
      console.warn(e)
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Rowers', null, {})
    await queryInterface.bulkDelete('Records', null, {})
    await queryInterface.bulkDelete('Logbooks', null, {})
  }
}
