module.exports = function (ipo) {
  var Cat = require('./cat.js')(ipo)
  var Dog = require('./dog.js')(ipo)
  var Lion = require('./lion.js')(ipo)
  var Elephant = require('./elephant.js')(ipo)

  var Zoo = ipo.obj(__filename, function () {})

  Zoo.prototype.cat = function (cb) {
    cb(null, new Cat())
  }

  Zoo.prototype.dog = function (cb) {
    cb(null, new Dog())
  }

  Zoo.prototype.elephant = function (cb) {
    cb(null, new Elephant())
  }

  Zoo.prototype.lion = function (cb) {
    cb(null, new Lion())
  }

  return Zoo
}
