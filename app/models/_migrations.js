const debug = require('debug')('sequelize:migrations')
const Umzug = require('umzug')
const path = require('path')

module.exports = async function (sequelize) {
  const migrationsConfig = {
    storage: 'sequelize',
    logging: debug,
    storageOptions: {
      sequelize: sequelize
    },
    migrations: {
      params: [
        sequelize.getQueryInterface()
      ],
      path: path.join(__dirname, '..', 'migrations')
    }
  }

  const seedsConfig = {
    storage: 'sequelize',
    logging: debug,
    storageOptions: {
      sequelize: sequelize,
      modelName: 'SequelizeData'
    },
    migrations: {
      params: [
        sequelize.getQueryInterface()
      ],
      path: path.join(__dirname, '..', 'seeders')
    }
  }

  const migrator = new Umzug(migrationsConfig)
  const seeder = new Umzug(seedsConfig)

  try {
    await migrator.up()
    await seeder.up()
    debug('Migrations finished')
  } catch (e) {
    debug(e)
  }
}
