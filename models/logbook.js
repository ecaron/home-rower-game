'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Logbook extends Model {
    static associate (models) {
      this.belongsTo(models.Rower)
    }
  };
  Logbook.init({
    mode: DataTypes.STRING,
    duration: DataTypes.INTEGER,
    distance: DataTypes.INTEGER,
    maxSpeed: DataTypes.DECIMAL(10, 2),
    date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Logbook'
  })
  return Logbook
}
