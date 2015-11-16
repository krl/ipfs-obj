var async = require('async')

module.exports = function (ipo) {
  var List = ipo.obj(__filename, function (elements) {
    this.links = elements
  })

  List.prototype.frong = function (cb) {
    async.map(this.links, function (link, mcb) {
      link.frong(mcb)
    }, cb)
  }

  return List
}
