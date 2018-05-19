/**
 * @file index
 * @author imcuttle
 * @date 2018/4/4
 * @description
 */
const minimatch = require('minimatch')
const grf = require('git-range-files')
const pify = require('pify')
const co = require('co')

/**
 * config sample like:
 * {
 *   All: {
 *   },
 *   Copied: {
 *     "src/*.js": [
 *       "echo"
 *     ]
 *   }
 * }
 */
const runStaged = co.wrap(function* runStaged(config) {
  let list = yield pify(grf)()
  console.log(list)
})

runStaged('Head')
