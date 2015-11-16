
var _ = require('lodash')

module.exports = function (ipo) {
  var MonoidAdd = ipo.obj(__filename, function (children, count) {
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

  return MonoidAdd
}
