/**
 * @file index
 * @author imcuttle
 * @date 2018/4/4
 * @description
 */

const minimatch = require('minimatch');
const grf = require('git-range-files');
const pify = require('pify');
const execa = require('execa');
const debug = require('debug')('ci-run-staged');
const Listr = require('listr');
const nps = require('path');

function loadConfig() {
  const cosmiconfig = require('cosmiconfig');
  const explorer = cosmiconfig('ci-run-staged');
  return explorer.search();
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
const runStaged = function runStaged(range, config = {}) {
  const cwd = config.cwd || process.cwd();
  grf.cwd = cwd;
  return pify(grf)({ head: range, relative: true }).then((list) => {
    debug('rang', range);
    debug('staged file', list);

    let files = list.reduce((map, { filename, status }) => {
      status = status.toLowerCase();
      map[status] = map[status] || [];
      map[status].push(filename);
      return map;
    }, {});

    const tasksMap = new Map();
    let tasks = [];
    Object.keys(config).forEach((key) => {
      let val = config[key];
      let lowKey = key.toLowerCase();

      let keys = [lowKey];
      if (lowKey.indexOf('|') >= 0) {
        keys = lowKey.split('|');
      }
      Object.keys(files).forEach((status) => {
        let listFile = files[status];
        if (keys.includes(status) || keys.includes('all')) {
          Object.keys(val).forEach((glob) => {
            let cmd = val[glob];
            if (typeof cmd === 'string') {
              cmd = [cmd];
            }

            let matchedFiles = minimatch
              .match(listFile, glob, {
                matchBase: true,
              })
              .map((filename) => nps.join(cwd, filename));

            debug('matchedFiles: %o, cmd: %o', matchedFiles, cmd);
            if (!matchedFiles.length) {
              return;
            }
            debug('glob', glob);
            const key = [keys.join('|'), glob, cmd.join('|')].join('$$');
            const cached = tasksMap.get(key);
            if (cached) {
              matchedFiles.forEach((file) => cached.files.add(file));
              return;
            }

            const files = new Set();
            matchedFiles.forEach((file) => files.add(file));

            const title = keys.join('|') + ' ' + glob;
            tasksMap.set(key, {
              title,
              cmd,
              files,
            });
          });
        }
      });
    });

    for (const [key, { files, cmd, title }] of tasksMap.entries()) {
      const matchedFiles = Array.from(files.values());
      tasks.push(
        new Listr([
          {
            title,
            task: () =>
              new Listr(
                cmd.map((eachCmd) => {
                  return {
                    title: eachCmd,
                    enabled: (ctx) => !ctx.fail,
                    task: (ctx, task) => {
                      ctx.fail = false;
                      return execa
                        .shell([eachCmd].concat(matchedFiles).join(' '), {
                          stdio: 'inherit',
                          cwd,
                        })
                        .then(({ stdout }) => {
                          debug('cmd: %s, output: \n%s', eachCmd, stdout);
                          return { cmd: eachCmd, output: stdout };
                        })
                        .catch((err) => {
                          ctx.fail = true;
                          debug('cmd: %s, error: %O happened', eachCmd, err);
                          throw err;
                        });
                    },
                  };
                })
              ),
          },
        ])
      );
    }

    return Promise.all(tasks.map((t) => t.run()))
      .then(() => {})
      .catch((err) => {
        err.code = 'CI_RUN_STAGED_TASK_ERROR';
        throw err;
      });
  });
};

runStaged.loadConfig = loadConfig;

module.exports = runStaged;
