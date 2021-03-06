const Datastore = require('nedb')
const path = require('path')

module.exports = {
  rowers: new Datastore({ filename: path.join(__dirname, '..', 'db', 'rowers'), autoload: true })
}
