'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Rower extends Model {
    static associate (models) {
      this.hasMany(models.Logbook)
      this.hasMany(models.Record)
    }
  };
  Rower.init({
    name: DataTypes.STRING,
    avatar: DataTypes.JSON,
    totalDistance: DataTypes.INTEGER,
    lastRowed: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Rower'
  })
  return Rower
}
