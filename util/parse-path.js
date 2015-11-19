
var Parser = {
  parse: function (path) {
    if (typeof path === 'number') return [path]
    if (typeof path !== 'string') return path

    var objParts = path.split('.')

    if (objParts.length === 1 && objParts[0].match(/^[0-9]/)) {
      return [parseInt(objParts[0], 10)]
    }

    var result = []
    for (var i = 0; i < objParts.length; i++) {
      var part = objParts[i]

      var objPart = part.match(/[^[]*/)[0]
      if (objPart.length) {
        result.push(objPart)
      }

      var arrayParts = part.match(/\[([0-9]*)\]/g)

      if (arrayParts) {
        for (var o = 0; o < arrayParts.length; o++) {
          // parseInt ignores extra noise at end
          result.push(parseInt(arrayParts[o].substr(1), 10))
        }
      }
    }
    return result
  },
  resolve: function (obj, path) {
    var parts = Parser.parse(path)
    var ref = obj
    for (var i = 0; i < parts.length; i++) {
      ref = ref[parts[i]]
    }
    return ref
  },
  update: function (obj, path, value) {
    var parts = Parser.parse(path)
    var parent = Parser.resolve(obj, parts.slice(0, -1))
    parent[parts.slice(-1)] = value
  }
}

module.exports = Parser
