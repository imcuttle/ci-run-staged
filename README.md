# ci-run-staged

[![build status](https://img.shields.io/travis/imcuttle/ci-run-staged/master.svg?style=flat-square)](https://travis-ci.org/imcuttle/ci-run-staged)
[![Test coverage](https://img.shields.io/codecov/c/github/imcuttle/ci-run-staged.svg?style=flat-square)](https://codecov.io/github/imcuttle/ci-run-staged?branch=master)
[![NPM version](https://img.shields.io/npm/v/ci-run-staged.svg?style=flat-square)](https://www.npmjs.com/package/ci-run-staged)
[![NPM Downloads](https://img.shields.io/npm/dm/ci-run-staged.svg?style=flat-square&maxAge=43200)](https://www.npmjs.com/package/ci-run-staged)

Run command inferred by git staged file expediently in ci.

Be inspired by [lint-staged](https://github.com/okonet/lint-staged)

## Installation and setup

1. `npm install --save-dev ci-run-staged`
2. Update your package.json like this:

```diff
{
  "scripts": {
+   "ci-run-staged": "ci-run-staged"
  },
+ "ci-run-staged": {
+   "added": {
+     "doc/**/*.md": [
+       "send email..."
+     ]
+   }
+ }
}
```

3. Execute `npm run ci-run-staged` in your ci scripts.

## Command line

```
./node_modules/.bin/ci-run-staged commit-range # like HEAD, hashA...hashB
```

When do not set commit range definitely, ci-run-staged would find range like this:

```
process.env.COMMIT_RANGE || process.env.TRAVIS_COMMIT_RANGE || process.env.CIRCLE_COMPARE_URL
```

## Debugger

Can be enabled by setting the environment variable `DEBUG` to `ci-run-staged*`.

```bash
DEBUG=ci-run-staged* ./node_modules/.bin/ci-run-staged
```
