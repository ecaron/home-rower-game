'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Record extends Model {
    static associate (models) {
      this.belongsTo(models.Rower)
    }
  }
  Record.init({
    start: DataTypes.DATE,
    maxSpeed: DataTypes.DECIMAL(10, 2),
    checkpoints: DataTypes.JSON,
    distance: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    competitor: DataTypes.INTEGER,
    won: DataTypes.BOOLEAN,
    mode: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Record'
  })
  return Record
}
