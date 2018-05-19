#!/usr/bin/env node
const logSymbols = require('log-symbols')
const runStaged = require('./index')

const range =
  process.env.COMMIT_RANGE ||
  process.env.TRAVIS_COMMIT_RANGE ||
  process.env.CIRCLE_COMPARE_URL

runStaged
  .loadConfig()
  .then(result => {
    if (!result) {
      console.log(
        logSymbols.error,
        'the config of ci-run-staged is not existed.'
      )
      process.exit(1)
    }
    return runStaged(range, result.config)
  })
  .catch(console.error.bind(console, logSymbols.error))
