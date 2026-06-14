const { Umzug, SequelizeStorage } = require('umzug')
const debug = require('debug')('sequelize:migrations')
const path = require('path')
const fs = require('fs')

module.exports = async function (sequelize) {
  const queryInterface = sequelize.getQueryInterface()

  function loadMigrations (dir) {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.js'))
      .sort()
      .map(filename => {
        const filePath = path.join(dir, filename)
        const migration = require(filePath)
        return {
          name: filename,
          up: () => migration.up(queryInterface),
          down: () => migration.down(queryInterface)
        }
      })
  }

  const migrator = new Umzug({
    migrations: loadMigrations(path.join(__dirname, '..', 'migrations')),
    storage: new SequelizeStorage({ sequelize }),
    logger: undefined
  })

  const seeder = new Umzug({
    migrations: loadMigrations(path.join(__dirname, '..', 'seeders')),
    storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeData' }),
    logger: undefined
  })

  try {
    await migrator.up()
    await seeder.up()
    debug('Migrations finished')
  } catch (e) {
    debug(e)
  }
}
