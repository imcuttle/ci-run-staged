/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
process.env.DEBUG = 'ci-run-staged'
const { join } = require('path')
const run = require('../')
const execa = require('execa')

describe('main', function() {
  let shell = jest.spyOn(execa, 'shell')
  beforeEach(() => {
    shell.mockClear()
  })
  it('should passed', function(done) {
    run('4c1b6d1...fa3a024', {
      all: {
        '*': ['echo 1'],
        'index*': 'echo 122',
        sss: 'nosss'
      }
    })
      .catch(err => expect(err).not.toBeUndefined())
      .then(() => {
        expect(shell).toHaveBeenCalledTimes(2)
        expect(shell).toBeCalledWith('echo 1 ' + [join(__dirname, '../package.json'), join(__dirname, '../package-lock.json'), join(__dirname, '../index.js')].join(' '))
        expect(shell).toBeCalledWith(['echo 122', join(__dirname, '../index.js')].join(' '))
        done()
      })
  })

  it('should fail when head is invalid', function(done) {
    run('abc', {
      all: {
        '*': ['echo 1'],
        'index*': 'echo 122'
      }
    })
      .catch(err => expect(err).not.toBeUndefined())
      .then(() => {
        expect(shell).toHaveBeenCalledTimes(0)
        done()
      })
  })

  it('should allow shell script', function(done) {
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
