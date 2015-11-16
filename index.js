'use strict'

/* global Reflect */

var _ = require('lodash')
var async = require('async')
var sink = require('stream-sink')
var bundle = require('./util/bundle.js')
var Reflect = require('harmony-reflect') // eslint-disable-line
var stringify = require('json-stable-stringify')
var memoize = require('memoize-async')

var IpfsObject = function (ipfs) {
  var Ref = function (persisted, meta) {
    this._ = { persisted: persisted }
    if (meta) this.meta = meta
  }

  var parseObject = function (obj) {
    // bug workaround
    if (typeof obj === 'string') {
      obj = JSON.parse(obj)
    }

    var js
    var data = JSON.parse(obj.Data)
    var linkmap = {}
    var linklist = []
    var links

    for (var i = 0; i < obj.Links.length; i++) {
      var link = obj.Links[i]

      if (link.Name === '\\m') {
        links = linkmap
        js = { Hash: link.Hash,
               Size: link.Size }
      } else if (link.Name === '\\l') {
        links = linklist
        js = { Hash: link.Hash,
               Size: link.Size }
      } else {
        var ref = new Ref({
          Hash: link.Hash,
          Size: link.Size
        }, data.meta[i])

        linklist.push(ref)
        linkmap[link.Name] = ref
      }
    }

    delete data.meta

    return { js: js,
             data: data,
             links: links }
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
            this.links = proxyLinks(parsed.links)
            this._ = { js: parsed.js,
                       persisted: persisted }
            if (typeof this.initMeta === 'function') {
              this.meta = this.initMeta()
            }
          }
          Extra.prototype = cons.prototype
          Extra.prototype.persist = persist

          cb(null, new Extra())
        })
      })
  }

  var arrayToMap = function (array) {
    var digits = 1
    if (array.length > 1000) {
      digits = 4
    } else if (array.length > 100) {
      digits = 3
    } else if (array.length > 10) {
      digits = 2
    }

    var map = {}
    for (var i = 0; i < array.length; i++) {
      map[('000' + i).substr(digits)] = array[i]
    }
    return map
  }

  var persist = function (cb) {
    var self = this
    if (self._ && self._.persisted) return cb(null, self)

    var links = self.links
    var linktype

    if (typeof self._.js === 'string') {
      return bundle(ipfs, this._.js, function (err, res) {
        if (err) return cb(err)
        self._.js = res
        self.persist(cb)
      })
    }

    if (links instanceof Array) {
      linktype = 'l'
      links = arrayToMap(links)
    } else {
      linktype = 'm'
    }

    async.map(_.pairs(self.links), function (nameLink, cbmap) {
      var name = nameLink[0]
      var link = nameLink[1]
      link.persist(function (err, res) {
        if (err) return cb(err)
        cbmap(null, { link: { Name: name,
                              Hash: link._.persisted.Hash,
                              Size: link._.persisted.Size },
                      meta: nameLink[1].meta })
      })
    }, function (err, res) {
      if (err) return cb(err)

      var links = []
      var metas = []

      for (var i = 0; i < res.length; i++) {
        links.push(res[i].link)
        metas.push(res[i].meta)
      }

      links.push({ Name: '\\' + linktype,
                   Hash: self._.js.Hash,
                   Size: self._.js.Size })

      var data = _.clone(self.data)
      if (metas.length) {
        data.meta = metas
      }

      var buf = Buffer(stringify({ Data: stringify(data),
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

  var ContextRef = function (ref, context) {
    return new Proxy(ref, {
      get: function (rec, name) {
        if (rec[name]) return rec[name] // for meta, etc
        if (name === 'inspect') return ref
        return function () {
          var args = []
          for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
          }
          fetch(ref._.persisted.Hash, ref.meta, function (err, res) {
            if (err) throw err
            context(res)

            if (res[name]) {
              res[name].apply(res, args)
            } else {
              throw new Error('No method ' + name + ' on ' + res)
            }
          })
        }
      }
    })
  }

  var proxyLinks = function (links) {
    return new Proxy(links, {
      get: function (rec, name) {
        if (rec[name] instanceof Ref) {
          return new ContextRef(rec[name], function (resolved) {
            links[name] = resolved
          })
        } else {
          return rec[name]
        }
      }
    })
  }

  var fetchType = memoize(function (link, cb) {
    ipfs.cat(link.Hash, function (err, res) {
      if (err) return cb(err)
      res.pipe(sink()).on('data', function (data) {
        var module = {}

        // inject context argument
        data = data.replace(/__filename/, stringify(link))

        eval(data) // eslint-disable-line

        if (typeof module.exports !== 'function') {
          throw new Error('Module does not export a constructor')
        }

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
      this.links = constructed.links || {}
      this._ = { js: js }
      if (typeof this.initMeta === 'function') {
        this.meta = this.initMeta()
      }
    }
    extra.prototype = cons.prototype
    extra.prototype.persist = persist

    return extra
  }

  var obj = function (context, fn) {
    return wrapConstructor(fn, context)
  }

  var IpoReference = { obj: obj,
                       fetch: fetch }

  return IpoReference
}

module.exports = IpfsObject
