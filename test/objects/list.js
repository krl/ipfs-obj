var async = require('async')

module.exports = function (ipo) {
  var List = ipo.obj(__filename, function (elements) {
    this.links = elements
  })

  List.prototype.frong = function (cb) {
    var self = this
    async.map(Object.keys(this.links), function (key, mcb) {
      self.call(key, 'frong', mcb)
    }, cb)
  }

  return List
}
