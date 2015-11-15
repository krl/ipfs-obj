
var ipo = require('ipfs-obj')
var _ = require('lodash')

var MonoidAdd = ipo.obj(function (children, count) {
  this.links = children
  this.data = { count: count || 0 }
})

MonoidAdd.prototype.initMeta = function () {
  return {
    count: _.reduce(this.links, function (m, n) {
      return m + n.meta.count
    }, this.data.count)
  }
}

module.exports = MonoidAdd
