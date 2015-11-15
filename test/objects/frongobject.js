var ipo = require('ipfs-obj')

var FrongObject = ipo.obj(function (frongness) {
  this.data = { frongness: frongness }
})

FrongObject.prototype.frong = function (cb) {
  cb(null, 'i frong at level ' + this.data.frongness)
}

module.exports = FrongObject
