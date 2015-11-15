var ipo = require('ipfs-obj')

var Child = ipo.obj(function (name, age) {
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

module.exports = Child
