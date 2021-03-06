#!/usr/bin/env node

'use strict'

function pickBundles () {
  var la = require('lazy-ass')
  var is = require('check-more-types')
  var path = require('path')
  var fs = require('fs')

  console.log('node version', process.versions.node)

  var SELF_NAME = 'pick-precompiled'
  function isSelfCompiling () {
    var packageFilename = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(packageFilename)) {
      var pkg = JSON.parse(fs.readFileSync(packageFilename))
      return pkg.name === SELF_NAME
    }
  }
  var SELF_COMPILING = isSelfCompiling()

  var packageFilename = './package.json'
  var pkg = JSON.parse(fs.readFileSync(packageFilename))

  var config = pkg.config && pkg.config['pre-compiled']
  la(is.object(config),
    'missing pre-compiled config in package file', packageFilename)
  var isPrecompiledConfig = is.schema({
    dir: is.unemptyString,
    files: is.array
  })
  la(isPrecompiledConfig(config), 'invalid config', config)

  var bundleNames = config.files.map(function (name) {
    return path.basename(name, '.js')
  })
  console.log('picking bundles for', bundleNames)

  function pickBundle (version, candidates) {
    var picked
    candidates.forEach(function (filename) {
      var forIndex = filename.indexOf('.for.')
      if (forIndex === -1) {
        console.error('invalid filename', filename)
        return
      }
      var bundleVersion = filename.substr(forIndex + 5).split('.js')[0]
      console.log('filename %s is for node %s', filename, bundleVersion)
      if (version.indexOf(bundleVersion) === 0) {
        picked = filename
      }
    })
    console.log('for node version %s picked bundle %s', version, picked)
    return picked
  }

  function formOutputFilename (dir, bundleName) {
    return path.join(dir, bundleName + '.js')
  }

  function copy (fromFilename, toFilename) {
    la(is.unemptyString(fromFilename), 'missing from filename', fromFilename)
    la(is.unemptyString(toFilename), 'missing to filename', toFilename)
    var text = fs.readFileSync(fromFilename, 'utf-8')

    if (SELF_COMPILING) {
      console.log('self compiling')
      console.log(text)
      text = text.replace(SELF_NAME, __dirname)
    }

    fs.writeFileSync(toFilename, text, 'utf-8')
  }

  var glob = require('glob')
  bundleNames.forEach(function (bundleName) {
    var mask = path.join(config.dir, bundleName + '.compiled.for.*.js')
    var candidates = glob.sync(mask)
    console.log('candidates for %s', bundleName, candidates)
    var picked = pickBundle(process.versions.node, candidates)
    la(is.unemptyString(picked), 'could not pick bundle for node',
      process.versions.node, 'among', candidates)
    var outputFilename = formOutputFilename(config.dir, bundleName)
    copy(picked, outputFilename)
    console.log('copied bundle', outputFilename)
  })
}

pickBundles()
