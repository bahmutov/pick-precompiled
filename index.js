var la = require('lazy-ass')
var is = require('check-more-types')
var path = require('path')

var packageFilename = './package.json'
var fs = require('fs')
var pkg = JSON.parse(fs.readFileSync(packageFilename))

var config = pkg.config && pkg.config['pre-compiled']
la(is.object(config),
  'missing pre-compiled config in package file', packageFilename)
var isPrecompiledConfig = is.schema({
  dir: is.unemptyString,
  files: is.array
})
la(isPrecompiledConfig(config), 'invalid config', config)
