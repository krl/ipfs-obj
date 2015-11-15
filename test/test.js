var ipfs = require('ipfs-api')('localhost', 5001)
var ipo = require('../index.js')(ipfs)
var stringify = require('json-stable-stringify')
var assert = require('assert')
var async = require('async')

/* global it */

it('should create, persist and restore FrongObject', function (done) {
  ipo.require(
    './objects/frongobject.js',
    function (FrongObject) {

      console.log(FrongObject)

      var frong = new FrongObject(7)

      frong.frong(function (err, res) {
        if (err) throw err
        assert.equal(res, 'i frong at level 7')

        frong.persist(function (err, res) {
          if (err) throw err

          ipo.fetch(res, function (err, res) {
            if (err) throw err

            // proxies breaks deepEqual
            assert.equal(stringify(res), stringify(frong))

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

it('links can be a map', function (done) {
  ipo.require(
    './objects/ab.js',
    './objects/frongobject.js',
    function (AB, FrongObject) {
      var ab = new AB(new FrongObject(188),
                      new FrongObject(1))

      ab.frong(function (err, res) {
        if (err) throw err

        assert.deepEqual(res, ['i frong at level 188',
                               'i frong at level 1'])

        ab.persist(function (err, res) {
          if (err) throw err

          assert(!(res.links instanceof Array))

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
})

it('links can be a list', function (done) {
  ipo.require(
    './objects/list.js',
    './objects/frongobject.js',
    function (List, FrongObject) {
      var list = new List([new FrongObject(188),
                           new FrongObject(1)])

      list.frong(function (err, res) {
        if (err) throw err
        assert.deepEqual(res, ['i frong at level 188',
                               'i frong at level 1'])

        list.persist(function (err, res) {
          if (err) throw err

          ipo.fetch(res, function (err, res) {
            if (err) throw err

            assert(res.links instanceof Array)

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
})

it('should allow recursive objects', function (done) {
  ipo.require(
    './objects/mother.js',
    './objects/child.js',
    function (Mother, Child) {
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
})

it('should allow new from within object', function (done) {
  ipo.require(
    './objects/mother.js',
    './objects/child.js',
    function (Mother, Child) {
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
})

it('should allow recursive dependencies', function (done) {
  this.timeout(10000)
  ipo.require(
    './objects/mother.js',
    function (Mother) {
      var m = new Mother([])
      m.gaveBirth('bob', 2, function (err, newMomi) {
        if (err) throw err
        newMomi.ageSum(function (err, res) {
          if (err) throw err
          assert.equal(res, 2)
          done()
        })
      })
    })
})

// should also restore meta on fetched children!

it('should save link metadata', function (done) {
  ipo.require(
    './objects/monoid-add.js',
    function (MonoidAdd) {

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
})

it('should import objects with deps', function (done) {
  ipo.require('./objects/depobject.js', function (DepObj) {
    var x = new DepObj()

    assert.equal(x.data.hello, 'howdy')

    done()
  })
})
