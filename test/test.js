var ipfs = require('ipfs-api')('localhost', 5001)
var ipo = require('../index.js')(ipfs)
var assert = require('assert')
var async = require('async')

var timeout = 10000

/* global describe, it */

var FrongObject = require('./objects/frongobject.js')(ipo)

it('should create, persist and restore FrongObject', function (done) {
  var frong = new FrongObject(7)

  frong.frong(function (err, res) {
    if (err) throw err
    assert.equal(res, 'i frong at level 7')

    frong.persist(function (err, res) {
      if (err) throw err

      ipo.fetch(res, function (err, res) {
        if (err) throw err

        assert.deepEqual(res, frong)

        res.frong(function (err, res) {
          if (err) throw err
          assert.equal(res, 'i frong at level 7')
          done()
        })
      })
    })
  })
})

it('should create, persist and restore FrongObject from ipo.require', function (done) {
  ipo.require(
    'QmQhZozgQLhoVMesFSNz9wwhQLcuC7wHEUztk7KQg8ioe6',
    function (FrongObject) {
      var frong = new FrongObject(7)

      frong.frong(function (err, res) {
        if (err) throw err
        assert.equal(res, 'i frong at level 7')

        frong.persist(function (err, res) {
          if (err) throw err

          ipo.fetch(res, function (err, res) {
            if (err) throw err

            assert.deepEqual(res, frong)

            res.frong(function (err, res) {
              if (err) throw err
              assert.equal(res, 'i frong at level 7')
              done()
            })
          })
        })
      })
    })
})

var AB = require('./objects/ab.js')(ipo)

it('links can be a map', function (done) {
  var ab = new AB(new FrongObject(188),
                  new FrongObject(1))

  ab.frong(function (err, res) {
    if (err) throw err

    assert.deepEqual(res, ['i frong at level 188',
                           'i frong at level 1'])

    ab.persist(function (err, res) {
      if (err) throw err
      ipo.fetch(res, function (err, res) {
        if (err) throw err
        res.frong(function (err, res) {
          if (err) throw err
          assert.deepEqual(res, ['i frong at level 188',
                                 'i frong at level 1'])
          done()
        })
      })
    })
  })
})

var List = require('./objects/list.js')(ipo)

it('links can be a list', function (done) {
  var list = new List([new FrongObject(188),
                       new FrongObject(1)])

  this.timeout(39999)

  list.frong(function (err, res) {
    if (err) throw err
    assert.deepEqual(res, ['i frong at level 188',
                           'i frong at level 1'])

    list.persist(function (err, res) {
      if (err) throw err

      ipo.fetch(res, function (err, res) {
        if (err) throw err

        res.frong(function (err, res) {
          if (err) throw err
          assert.deepEqual(res, ['i frong at level 188',
                                 'i frong at level 1'])
          done()
        })
      })
    })
  })
})

var Mother = require('./objects/mother.js')(ipo)
var Child = require('./objects/child.js')(ipo)

it('should allow recursive objects', function (done) {
  var m = new Mother([
    new Child('alice', 10),
    new Child('berndt', 8),
    new Child('ada', 33)
  ])

  m.ageSum(function (err, value) {
    if (err) throw err
    assert.equal(value, 51)

    m.persist(function (err, res) {
      if (err) throw err

      ipo.fetch(res, function (err, res) {
        if (err) throw err

        res.ageSum(function (err, value) {
          if (err) throw err
          assert.equal(value, 51)
          done()
        })
      })
    })
  })
})

it('should allow new from within object', function (done) {
  var m = new Mother([
    new Child('alice', 10),
    new Child('berndt', 8),
    new Child('ada', 33)
  ])

  m.clone(function (err, res) {
    if (err) throw err

    async.parallel(
      [
        function (a) {
          m.persist(function (err, res) {
            if (err) throw err
            assert(res)
            a(null, res)
          })
        },
        function (b) {
          res.persist(function (err, res) {
            if (err) throw err
            assert(res)
            b(null, res)
          })
        }
      ],
      function (err, res) {
        if (err) throw err

        assert.equal(res[0], res[1])
        done()
      })
  })
})

var Zoo = require('./objects/zoo.js')(ipo)
var Dog = require('./objects/dog.js')(ipo)
var Elephant = require('./objects/elephant.js')(ipo)
var Cat = require('./objects/cat.js')(ipo)
var Lion = require('./objects/lion.js')(ipo)

describe('should allow recursive dependencies', function (done) {
  it('on in-memory objects', function (done) {
    var z = new Zoo()
    var c = new Cat()
    var d = new Dog()
    var e = new Elephant()
    var l = new Lion()
    async.parallel(
      [z.cat, z.dog, z.elephant, z.lion],
      function (err, res) {
        if (err) throw err
        assert.deepEqual(c, res[0])
        assert.deepEqual(d, res[1])
        assert.deepEqual(e, res[2])
        assert.deepEqual(l, res[3])
        done()
      })
  })

  it('on persisted objects', function (done) {
    var z = new Zoo()
    var e = new Elephant()
    var d = new Dog()
    var l = new Lion()
    var c = new Cat()

    async.parallel(
      [
        z.persist.bind(z),
        e.persist.bind(e),
        d.persist.bind(d),
        l.persist.bind(l),
        c.persist.bind(c)
      ],
      function (err, persisted) {
        if (err) throw err
        async.parallel(
          [
            function (cb) { ipo.fetch(persisted[0], cb) },
            function (cb) { ipo.fetch(persisted[1], cb) },
            function (cb) { ipo.fetch(persisted[2], cb) },
            function (cb) { ipo.fetch(persisted[3], cb) },
            function (cb) { ipo.fetch(persisted[4], cb) }
          ],
          function (err, restored) {
            if (err) throw err
            async.parallel(
              [
                function (cb) { restored[0].elephant(cb) },
                function (cb) { restored[0].dog(cb) },
                function (cb) { restored[0].lion(cb) },
                function (cb) { restored[0].cat(cb) }
              ],
              function (err, animals) {
                if (err) throw err
                assert.deepEqual(animals[0]._.js, restored[1]._.js)
                assert.deepEqual(animals[1]._.js, restored[2]._.js)
                assert.deepEqual(animals[2]._.js, restored[3]._.js)
                assert.deepEqual(animals[3]._.js, restored[4]._.js)
                done()
              })
          })
      })
  })
})

var MonoidAdd = require('./objects/monoid-add.js')(ipo)

it('should save link metadata', function (done) {
  this.timeout(timeout)

  var m = new MonoidAdd([
    new MonoidAdd([
      new MonoidAdd([], 11)
    ]),
    new MonoidAdd([
      new MonoidAdd([], 2),
      new MonoidAdd([], 8)
    ])
  ])

  assert.equal(m.meta.count, 21)

  m.persist(function (err, res) {
    if (err) throw err

    ipo.fetch(res, function (err, res) {
      if (err) throw err
      assert.equal(res.meta.count, 21)
      done()
    })
  })
})

var DepObj = require('./objects/depobject.js')(ipo)

it('should import objects with deps', function (done) {
  var x = new DepObj()

  assert.equal(x.data.hello, 'howdy')

  done()
})

it('should ensure child is loaded in memory', function (done) {
  var m = new Mother([
    new Child('alice', 10),
    new Child('berndt', 8),
    new Child('ada', 33)
  ])

  m.data[0].load(function (err, loaded1) {
    if (err) throw err

    m.persist(function (err, res) {
      if (err) throw err

      ipo.fetch(res, function (err, res) {
        if (err) throw err

        res.data[0].load(function (err, loaded2) {
          if (err) throw err

          assert.deepEqual(loaded1, loaded2)
          done()
        })
      })
    })
  })
})
