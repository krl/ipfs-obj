
# Ipfs-obj Duck-typed Javascript Objects on IPFS

## motivation

This is a side-project that fell out of the frustration manually working with ipfs objects.

Instead of having to manually persist and restore your objects, ipfs-obj takes care of the heavy lifting, and lets you use javascript objects directly.

I made this to make constructing datastructures on top of ipfs a breeze.

## example

### object definition

```js
module.exports = function (ipo) {

  var Duck = ipo.obj(function (loudness) {
    this.data = loudness
  })

  Duck.prototype.quack = function (cb) {
    if (this.data > 10) return cb(null, 'QUACK')
    cb(null, 'Quack')
  }

  return Duck
}
```

Using:

```js

var ipfs = require('ipfs-api')('localhost', 5001)
var ipo = require('ipfs-obj')(ipfs)

var Duck = require('./duck.js')(ipo)

var ling = new Duck(2)

ling.quack(function (err, res) {
  console.log('duck says', res)
})

ling.persist(function (err, hash) {

  // we now have a hash representing the instance of our duckling

  ipo.fetch(hash, function (err, res) {

    // res is now the restored duckling
    // and we can call the same method on it...

    res.quack(function (err, res) {
      console.log('duck says', res)
    })
  })
})
```

## Limitations, features

An ipfs object is expected to have certain properties, that you need to keep in mind.

The general structure is :

```js
{ data: '<Any JSON-serializable value>'
  links: '<either a {} or a [] of other ipfs-objects>'
  meta: '<generated metadata>' }
```

The data portion can be arbitrary Json, and can be accessed by this.data in methods.

The links portion can be either a map or an array, and links the object to other objects.

The meta property gets appended to link metadata in other objects pointing to this. The perfect place to keep your monoids! And in general, metadata on your links you will want to look at without loading the child.

NB: ipfs-objects should be concidered immutable, and you should not be changing any of these fields after instatiating the object, otherwise undefined behavior awaits.

Methods on objects also have to be asynchronous.

## Special methods

If you want ta use metadata on your objects, you need to provide a special `initMeta` method that returns an object, mapping metadata names to values, like so:

```js
MonoidAdd.prototype.initMeta = function () {
  return {
    count: _.reduce(this.links, function (m, n) {
      return m + n.meta.count
    }, this.data.count)
  }
}
```

## Memory model

The memory model is lazy, if you fetch an object (say a tree root) that refers to lots of other objects, only the first one will be loaded into memory, its links table will be  populated by special Reference objects, when a method is called on a reference, this object is lazy-loaded into memory, in-place overwriting the ref, and executing the method on the newly instanciated object.

This way, you can have a huge set referenced, and find one element in it, without having to load the whole thing into memory.

## License

MIT
