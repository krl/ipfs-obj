
module.exports = function (ipo) {
  var Child = ipo.obj(__filename, function (name, age) {
    this.data = {
      name: name,
      age: age
    }
    this.meta = {
      old: age > 15
    }
  })

  Child.prototype.ageSum = function (cb) {
    cb(null, this.data.age)
  }

  return Child
}
