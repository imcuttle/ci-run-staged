/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
const { mockPrompts } = require('edam')
const { join } = require('path')
const co = require('co')

describe('main', function() {
  it(
    'should edam passed',
    co.wrap(function*() {
      const fp = yield mockPrompts(join(__dirname, '../'), {

      })

      expect(Object.keys(fp.tree)).toEqual(
        expect.arrayContaining(['package.json', 'index.js'])
      )
    })
  )
})
