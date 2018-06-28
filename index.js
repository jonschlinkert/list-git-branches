'use strict';

var os = require('os');
var cp = require('child_process');
var extend = require('extend-shallow');
var Promise = require('bluebird');

function branches(cwd, options) {
  var opts = extend({}, options, {cwd: cwd});

  return new Promise(function(resolve, reject) {
    // step 1. update the tracking remote branch
    cp.exec('git remote update --prune', opts, function(err, stdout, stderr) {
      if (err) {
        reject(err);
        return;
      }
      resolve(null);
    });
  }).then(function() {
    return new Promise(function(resolve, reject) {
      // step 2. get all branches
      cp.exec('git branch -a', opts, function(err, stdout, stderr) {
        if (err) {
          reject(err);
          return;
        }
        resolve(parseBranches(stdout.toString()));
      });
    });
  });
}

branches.async = function(cwd, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = undefined;
  }
  branches(cwd, options)
    .then(function(res) {
      cb(null, res);
    })
    .catch(function(err) {
      cb(err, null);
    });
}

branches.sync = function(cwd, options) {
  var execDefaults = {timeout: 3000, killSignal: 'SIGKILL'};
  var opts = extend({}, execDefaults, options, {cwd: cwd});
  var buf = cp.execSync('git branch -a', opts);
  return parseBranches(buf.toString());
};

function parseBranches(str) {
  var res = {
    local: [],
    remote: []
  }
  if (!str) return res;
  var lines = str.trim().split(os.EOL);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim().replace(/^\*\s*/, '');
    if('remotes/origin/HEAD -> origin/master' === line) {
      // ignore - remotes/origin/HEAD -> origin/master
      // do nothing
    } else if(line.indexOf('remotes/origin') === 0) {
      res.remote.push(line.split('/').pop());
    } else {
      res.local.push(line);
    }
  }
  return res;
}

/**
 * Expose `branches`
 */

module.exports = branches;
