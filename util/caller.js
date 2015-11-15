
// hack to make relative paths work in ipo.require
// this is only used in development

module.exports = function () {
  var originalFunc = Error.prepareStackTrace

  try {
    var err = new Error()
    var currentFile

    Error.prepareStackTrace = function (_, stack) {
      return stack
    }

    currentFile = err.stack.shift().getFileName()

    while (err.stack.length) {
      // when the first part of the path changes, we're done.
      var candidate = err.stack.shift().getFileName()
      if (candidate.split('/')[1] !== currentFile.split('/')[1]) {
        break
      }
      currentFile = candidate
    }
  } catch (e) {}

  Error.prepareStackTrace = originalFunc

  return currentFile
}
