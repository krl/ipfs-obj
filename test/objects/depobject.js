var dep = require('./dep.js')

module.exports = function (ipo) {
  var DepObject = ipo.obj(__filename, function () {
    this.data = { hello: dep.greet() }
  })

  return DepObject
}
