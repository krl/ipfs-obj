var ipo = require('ipfs-obj')

var dep = require('./dep.js')

var DepObject = ipo.obj(function () {
  this.data = { hello: dep.greet() }
})

module.exports = DepObject
