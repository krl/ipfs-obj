var async = require('async')
var ipo = require('ipfs-obj')

var Mother = ipo.obj(function (children) {
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

Mother.prototype.gaveBirth = function (name, age, cb) {
  ipo.require(
    './child.js',
    function (Child) {
      cb(null, new Mother([new Child(name, age)]))
    })
}

module.exports = Mother
