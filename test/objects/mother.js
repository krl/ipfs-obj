var async = require('async')

module.exports = function (ipo) {
  var Child = require('./child.js')(ipo)

  var Mother = ipo.obj(__filename, function (children) {
    this.links = children
  })

  Mother.prototype.ageSum = function (cb) {
    async.reduce(this.links, 0, function (m, n, cb2) {
      n.ageSum(function (err, res) {
        if (err) return cb(err)
        cb2(null, m + res)
      })
    }, cb)
  }

  Mother.prototype.clone = function (cb) {
    cb(null, new Mother(this.links))
  }

  return Mother
}
