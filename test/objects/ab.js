var async = require('async')

module.exports = function (ipo) {
  var AB = ipo.obj(__filename, function (a, b) {
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

  return AB
}
