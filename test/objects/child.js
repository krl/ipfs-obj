
module.exports = function (ipo) {
  var Child = ipo.obj(__filename, function (name, age) {
    this.data = {
      name: name,
      age: age
    }
  })

  Child.prototype.ageSum = function (cb) {
    cb(null, this.data.age)
  }

  return Child
}
