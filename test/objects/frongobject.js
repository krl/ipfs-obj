module.exports = function (ipo) {
  var FrongObject = ipo.obj(__filename, function (frongness) {
    this.data = { frongness: frongness }
  })

  FrongObject.prototype.frong = function (cb) {
    cb(null, 'i frong at level ' + this.data.frongness)
  }

  return FrongObject
}
