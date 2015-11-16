var browserify = require('browserify')
var async = require('async')

var memoize = require('memoize-async')

var bundle = memoize(function (ipfs, path, cb) {
  var b = browserify([path], { standalone: 'bundle',
                               detectGlobals: false})
    .exclude('buffer')
    .bundle(function (err, res) {
      if (err) throw err

      ipfs.add(res, function (err, res) {
        if (err) return cb(err)
        ipfs.object.stat(res[0].Hash, function (err, stat) {
          cb(null, { Hash: stat.Hash,
                     Size: stat.CumulativeSize })
        })
      })
    })
}, function (ipfs, path) {
  return path
})

module.exports = bundle
