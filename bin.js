#!/usr/bin/env node
const logSymbols = require('log-symbols')
const runStaged = require('./index')

const range =
  process.argv[2] ||
  process.env.COMMIT_RANGE ||
  process.env.TRAVIS_COMMIT_RANGE ||
  process.env.CIRCLE_COMPARE_URL

const errorLog = console.error.bind(console, logSymbols.error)

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
  .catch(error => {
    if (error.code === 'CI_RUN_STAGED_TASK_ERROR') {
      process.exitCode = 1
      return
    }
    errorLog(error)
    process.exitCode = 1
  })
