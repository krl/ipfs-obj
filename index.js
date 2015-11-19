'use strict'

/* global Reflect */

var _ = require('lodash')
var async = require('async')
var sink = require('stream-sink')
var bundle = require('./util/bundle.js')
var parse = require('./util/parse-path.js')
var stringify = require('json-stable-stringify')
var memoize = require('memoize-async')
var traverse = require('traverse')

var IpfsObject = function (ipfs) {
  var parseObject = function (obj) {
    // bug workaround
    if (typeof obj === 'string') {
      obj = JSON.parse(obj)
    }

    var js
    var parsed = JSON.parse(obj.Data)
    var meta = parsed[0]
    var data = parsed[1]

    for (var i = 0; i < obj.Links.length; i++) {
      var link = obj.Links[i]

      if (link.Name === 'js') {
        js = { Hash: link.Hash,
               Size: link.Size }
      } else {
        var nr = parseInt(link.Name, 10)

        parse.update(data, meta[nr][0], new Ref({
          Hash: link.Hash,
          Size: link.Size
        }, meta[nr][1]))
      }
    }

    return { js: js,
             data: data }
  }

  var fetch = function (path, meta, cb) {
    if (!cb) {
      cb = meta
      meta = {}
    }
    async.parallel(
      [
        function (cbpara) {
          ipfs.object.get(path, cbpara)
        },
        function (cbpara) {
          ipfs.object.stat(path, cbpara)
        }
      ],
      function (err, res) {
        if (err) return cb(err)

        var parsed = parseObject(res[0])
        var persisted = { Hash: res[1].Hash,
                          Size: res[1].CumulativeSize }

        fetchType(parsed.js, function (err, cons) {
          if (err) return cb(err)

          // instanciate without triggering constructor
          var Extra = function () {
            this.data = parsed.data
            this.meta = meta
            this._ = { js: parsed.js,
                       persisted: persisted }
            if (typeof this.initMeta === 'function') {
              this.meta = this.initMeta()
            }
          }
          Extra.prototype = cons.prototype
          Extra.prototype.persist = persist
          Extra.prototype.call = call
          Extra.prototype.load = function (cb) { cb(null, this) }

          cb(null, new Extra())
        })
      })
  }

  var persist = function (cb) {
    var self = this

    if (self._ && self._.persisted) return cb(null, self)

    if (typeof self._.js === 'string') {
      return bundle(ipfs, this._.js, function (err, res) {
        if (err) return cb(err)
        self._.js = res
        self.persist(cb)
      })
    }

    var links = []

    links.push({ Name: 'js',
                 Hash: self._.js.Hash,
                 Size: self._.js.Size })

    var data = _.clone(self.data)

    // find ipfs-objects to reference

    var dataPaths = traverse.paths(data)
    var pathMap = {}
    for (var i = 0; i < dataPaths.length; i++) {
      var path = dataPaths[i]
      var ref = data
      var shortest = []
      for (var o = 0; o < path.length; o++) {
        if (ref) {
          var oldref = ref
          ref = ref[path[o]]
          shortest.push(path[o])

          if (ref && typeof ref.persist === 'function') {
            if (oldref instanceof Array) {
              // 0 is smaller than null in JSON
              oldref[path[o]] = 0
            } else {
              delete oldref[path[o]]
            }
            pathMap[shortest.join('.')] = ref
            break
          }
        }
      }
    }
    // sort out non-unique ones and assign ids

    var objectLinks = []
    var mapping = {}
    _.map(pathMap, function (obj, path) {
      var idx = objectLinks.length
      mapping[idx] = [path, obj.meta]
      objectLinks.push(obj)
    })

    async.map(objectLinks, function (item, cb) {
      item.persist(cb)
    }, function (err, res) {
      if (err) return cb(err)

      for (var i = 0; i < res.length; i++) {
        links.push({ Name: i + '',
                     Hash: res[i],
                     Size: objectLinks[i]._.persisted.Size })
      }

      var buf = Buffer(stringify({ Data: stringify([mapping, data]),
                                   Links: links }))

      ipfs.object.put(buf, 'json', function (err, put) {
        if (err) return cb(err)

        ipfs.object.stat(put.Hash, function (err, stat) {
          if (err) return cb(err)

          self._.persisted = { Hash: stat.Hash,
                               Size: stat.CumulativeSize }

          cb(null, stat.Hash)
        })
      })
    })
  }

  var call = function (path, method) {
    var self = this

    var args = []
    for (var i = 2; i < arguments.length; i++) {
      args.push(arguments[i])
    }
    var link = parse.resolve(this.data, path)

    if (link instanceof Ref) {
      fetch(link._.persisted.Hash, link.meta, function (err, res) {
        if (err) throw err
        // into memory
        parse.update(self.data, path, res)
        res[method].apply(res, args)
      })
    } else {
      link[method].apply(link, args)
    }
  }

  var fetchType = memoize(function (link, cb) {
    ipfs.cat(link.Hash, function (err, res) {
      if (err) return cb(err)
      res.pipe(sink()).on('data', function (data) {
        var module = {}

        // inject self-argument
        data = data.replace(/['"]__IPO_SELF['"]/, stringify(link))
        eval(data) // eslint-disable-line

        cb(null, wrapConstructor(module.exports(IpoReference), link))
      })
    })
  }, function (link) {
    return link.Hash
  })

  var wrapConstructor = function (cons, js) {
    var extra = function () {
      var constructed = {}
      cons.apply(constructed, arguments)
      this.data = typeof constructed.data === 'undefined'
        ? {} : constructed.data

      this.meta = constructed.meta || {}
      this._ = { js: js }
      if (typeof this.initMeta === 'function') {
        this.meta = this.initMeta()
      }
    }
    extra.prototype = cons.prototype
    extra.prototype.persist = persist
    extra.prototype.call = call
    extra.prototype.load = function (cb) { cb(null, this) }

    return extra
  }

  var Ref = function (persisted, meta) {
    this._ = { persisted: persisted }
    if (meta) this.meta = meta
  }

  Ref.prototype.load = function (cb) {
    fetch(this._.persisted.Hash, cb)
  }

  var obj = function (context, fn) {
    return wrapConstructor(fn, context)
  }

  var IpoReference = { obj: obj,
                       fetch: fetch }

  return IpoReference
}

module.exports = IpfsObject
