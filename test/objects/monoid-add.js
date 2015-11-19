
var _ = require('lodash')

module.exports = function (ipo) {
  var MonoidAdd = ipo.obj(__filename, function (children, count) {
    this.data = { children: children,
                  count: count || 0 }
  })

  MonoidAdd.prototype.initMeta = function () {
    var self = this
    return {
      count: _.reduce(self.data.children, function (m, n) {
        return m + n.meta.count
      }, self.data.count)
    }
  }

  return MonoidAdd
}
