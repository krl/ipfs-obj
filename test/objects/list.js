var async = require('async')
var _ = require('lodash')

module.exports = function (ipo) {
  var List = ipo.obj(__filename, function (elements) {
    this.data = elements
  })

  List.prototype.frong = function (cb) {
    var self = this

    async.map(_.range(self.data.length), function (idx, mcb) {
      self.call(idx, 'frong', mcb)
    }, cb)
  }

  return List
}
