var async = require('async')
var ipo = require('ipfs-obj')

var List = ipo.obj(function (elements) {
  this.links = elements
})

List.prototype.frong = function (cb) {
  async.map(this.links, function (link, mcb) {
    link.frong(mcb)
  }, cb)
}

module.exports = List
