/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
const { join } = require('path')
const run = require('../')

describe('main', function() {
  it('should passed', function(done) {
    run('HEAD', {
      all: {
        '*': ['echo 1'],
        'index*': 'echo 122'
      }
    }).then(done)
  })

  it('should fail when head is invalid', function(done) {
    run('abc', {
      all: {
        '*': ['echo 1'],
        'index*': 'echo 122'
      }
    })
      .then(done)
      .catch(err => expect(err).not.toBeUndefined())
      .then(done)
  })
})
