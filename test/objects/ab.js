var async = require('async')
var ipo = require('ipfs-obj')

var AB = ipo.obj(function (a, b) {
  this.links = { a: a, b: b }
})

AB.prototype.frong = function (cb) {
  var self = this
  async.parallel([
    function (pcb) {
      self.links.a.frong(pcb)
    },
    function (pcb) {
      self.links.b.frong(pcb)
    }], cb)
}

module.exports = AB
