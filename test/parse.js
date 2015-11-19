var parse = require('../util/parse-path.js')
var assert = require('assert')

/* global describe, it */

describe('Path parsing', function () {
  it('should parse paths correctly', function () {
    assert.deepEqual(parse.parse('a.b.c'),
                     ['a', 'b', 'c'])

    assert.deepEqual(parse.parse('a.f[0][1].c[4]'),
                     ['a', 'f', 0, 1, 'c', 4])

    assert.deepEqual(parse.parse('[20]'),
                     [20])

    assert.deepEqual(parse.parse('20'),
                     [20])

    assert.deepEqual(parse.parse(20),
                     [20])
  })

  it('should resolve paths in objects', function () {
    var testObj = {
      a: { f: [ [ 39, { c: [0, 1, 2, 3, 99] }, 1, 2 ], 0 ],
           b: {
             c: 'hello'
           }
         }
    }

    assert.equal(parse.resolve(testObj, 'a.b.c'), 'hello')
    assert.equal(parse.resolve(testObj,
                               ['a', 'f', 0, 1, 'c', 4]),
                 99)
  })

  it('should update paths in objects', function () {
    var testObj = {
      a: { f: [ [ 39, { c: [0, 1, 2, 3, 99] }, 1, 2 ], 0 ],
           b: {
             c: 'hello'
           }
         }
    }

    var testArray = []

    parse.update(testObj, 'a.b.c', 'howdy-do')
    assert.equal(parse.resolve(testObj, 'a.b.c'), 'howdy-do')

    parse.update(testObj, 'a.f[0][1].c[4]', 42)
    assert.equal(parse.resolve(testObj,
                               ['a', 'f', 0, 1, 'c', 4]),
                 42)

    parse.update(testArray, 3, 42)
    assert.equal(parse.resolve(testArray, 3), 42)
  })
})
