var browserify = require('browserify')
var async = require('async')

var tools = require('browserify-transform-tools')
var replacer = require('async-replace')
var upath = require('path')
var memoize = require('memoize-async')

var bundle = memoize(function (ipfs, path, cb) {
  var replaceRel = tools.makeStringTransform(
    "ipfsifyrel", {},
    function (content, transformOptions, done) {
      var file = transformOptions.file;

      // replaces relative paths with their bundle hashes

      var asyncReplaceRel = function (res, ofs, string, cb) {
        var strings = res.match(/["'][^'"]*['"]/g)
        async.map(strings, function (str, mcb) {
          var part = str.substr(1, str.length - 2)

          if (part[0] === '.') {
            var resolved = upath.resolve(upath.dirname(file), part)

            bundle(ipfs, resolved, function (err, res) {
              if (err) return cb(err)
              mcb(null, '\'' + res.Hash + '\'')
            })

          } else {
            mcb(null, '\'' + part + '\'')
          }
        }, function (err, res) {
          cb(null, 'ipo.require(' + res.join(',') + ", function")
        })
      }

      replacer(content, /ipo.require *\([\S\s]*?function/g,
               asyncReplaceRel, function(err, res) {
                 done(null, res)
               })
    })

  var replaceReq = tools.makeRequireTransform(
    "ipfsifyreq", { evaluateArguments: true },
    function (args, opts, cb) {
      if (args[0] === 'ipfs-obj') {
        return cb(null, 'IPO')
      } else {
        return cb()
      }
    })

  var b = browserify([path], { standalone: 'bundle'})
    .transform(replaceReq)
    .transform(replaceRel)
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
