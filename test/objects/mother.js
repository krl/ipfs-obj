var async = require('async')

module.exports = function (ipo) {
  var Mother = ipo.obj(__filename, function (children) {
    this.links = children
  })

  Mother.prototype.ageSum = function (cb) {
    var self = this
    async.reduce(Object.keys(this.links), 0, function (m, key, cb2) {
      self.call(key, 'ageSum', function (err, res) {
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
