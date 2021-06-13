const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const basename = path.basename(__filename)
const migrations = require('./_migrations')
const db = {}

let dbPath
if (process.versions.electron) {
  const electron = require('electron')
  dbPath = (electron.app || electron.remote.app).getPath('userData')
} else {
  dbPath = path.join(__dirname, '..', 'db')
}

const sequelize = new Sequelize('', '', '', {
  dialect: 'sqlite',
  storage: path.join(dbPath, 'data.sqlite3'),
  logging: false
})

db.init = async function () {
  await migrations(sequelize)

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db)
    }
  })
}

fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file[0] !== '_') && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
    db[model.name] = model
  })

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
