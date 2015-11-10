
module.exports = function () {
  var originalFunc = Error.prepareStackTrace

  var callerfile
  try {
    var err = new Error()
    var currentfile

    Error.prepareStackTrace = function (_, stack) {
      return stack
    }

    currentfile = err.stack.shift().getFileName()

    var count = 2

    while (err.stack.length) {
      callerfile = err.stack.shift().getFileName()

      if (currentfile !== callerfile) count--
      if (!count) break
    }
  } catch (e) {}

  Error.prepareStackTrace = originalFunc

  return callerfile
}
