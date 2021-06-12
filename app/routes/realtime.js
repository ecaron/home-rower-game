const S4 = require('../s4')

module.exports = function (req, res) {
  S4.rower.reset()
  res.render('realtime')
}
