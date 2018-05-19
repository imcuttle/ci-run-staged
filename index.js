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
const spawn = require('cross-spawn')
const debug = require('debug')('ci-run-staged')
const Listr = require('listr')


function loadConfig() {
  const cosmiconfig = require('cosmiconfig')
  const explorer = cosmiconfig('ci-run-staged')
  return explorer.search()
}

function processAsync(process, cmd = '', cb) {
  if (typeof cmd === 'function') {
    cb = cmd
    cmd = ''
  }

  debug('running %s', cmd)
  process.on('error', function(err) {
    debug('error happened %s of cmd: %s', err.message, cmd)
    cb && cb(err)
  })

  let stderr = ''
  let stdout = ''
  process.stderr &&
    process.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })
  process.stdout &&
    process.stdout.on('data', chunk => {
      stdout += chunk.toString()
    })
  process.on('close', function(status) {
    debug('exit code(%s) of cmd: %s', status, cmd)
    if (status == 0) {
      cb && cb(null, stdout)
    } else {
      cb &&
        cb(
          new Error(
            (
              (cmd ? `'${cmd}' failed with status ` + status + '\n' : '') +
              stderr
            ).trim()
          )
        )
    }
  })
}

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
const runStaged = co.wrap(function* runStaged(range, config) {
  let list = yield pify(grf)({ head: range })
  let files = list.reduce((map, { filename, status }) => {
    status = status.toLowerCase()
    map[status] = map[status] || []
    map[status].push(filename)
    return map
  }, {})

  let tasks = []
  Object.keys(config).forEach(key => {
    let val = config[key]
    let lowKey = key.toLowerCase()

    let keys = [lowKey]
    if (lowKey.indexOf('|') >= 0) {
      keys = lowKey.split('|')
    }

    Object.keys(files).forEach(status => {
      let listFile = files[status]
      if (keys.includes(status) || keys.includes('all')) {
        Object.keys(val).forEach(glob => {
          let cmd = val[glob]
          if (typeof cmd === 'string') {
            cmd = [cmd]
          }

          let matchedFiles = minimatch.match(listFile, glob, {
            matchBase: true
          })

          debug('matchedFiles: %o, cmd: %o', matchedFiles, cmd)

          let task = new Listr(
            cmd.map(eachCmd => {
              return {
                title: eachCmd,
                enabled: ctx => !ctx.fail,
                task: (ctx, task) => {
                  ctx.fail = false
                  let chunks = eachCmd.split(/\s/)
                  const proc = spawn(
                    chunks[0],
                    chunks.concat(matchedFiles).slice(1),
                    {
                      stdio: 'pipe'
                    }
                  )
                  return pify(processAsync)(proc, eachCmd)
                    .then(output => {
                      debug('cmd: %s, output: \n%s', eachCmd, output)
                      return { cmd: eachCmd, output: output }
                    })
                    .catch(err => {
                      ctx.fail = true
                      debug('cmd: %s, error: %s happened', eachCmd, err.message)
                      throw err
                    })
                }
              }
            })
          )

          tasks.push(
            new Listr([
              {
                title: keys.join('|') + ' ' + glob,
                task: () => task
              }
            ])
          )
        })
      }
    })
  })

  return Promise.all(tasks.map(t => t.run())).then(() => {})
})

runStaged.loadConfig = loadConfig

module.exports = runStaged
