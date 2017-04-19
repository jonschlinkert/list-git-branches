'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var cp = require('child_process');
var extend = require('extend-shallow');
var listRemotes = require('list-git-remotes');

var execDefaults = {
  timeout: 3000,
  killSignal:'SIGKILL'
};

function branches(cwd, remote, cb) {
  if (typeof cwd === 'function') {
    cb = cwd;
    remote = 'origin';
    cwd = process.cwd();
  }

  if (typeof remote === 'function') {
    cb = remote;
    remote = 'origin';
  }

  if (typeof cb !== 'function') {
    throw new TypeError('expected callback to be a function');
  }

  var dir = path.resolve(cwd);
  if (!/\.git$/.test(dir)) {
    dir = path.join(dir, '.git');
  }

  var git = path.resolve.bind(path, cwd);

  fetch(dir, remote, function(err, stdout, stderr) {
    if (err) {
      cb(err, null, stderr);
      return;
    }

    fs.stat(git(), function(err, stat) {
      if (err) {
        cb(err);
        return;
      }

      if (!stat.isDirectory()) {
        cb(new Error('expected a .git repository to exist: ' + git()));
        return;
      }

      fs.readFile(git('FETCH_HEAD'), function(err, buf) {
        if (err) {
          if (err.code === 'ENOENT') {
            cb(null, ['master']);
            return;
          }
          cb(err);
          return;
        }
        cb(null, parseBranches(String(buf)));
      });
    });
  });
}

function branchesSync(cwd, remote) {
  var dir = cwd ? path.resolve(cwd) : process.cwd();
  if (!/\.git$/.test(dir)) {
    dir = path.join(dir, '.git');
  }

  var git = path.resolve.bind(path, cwd);
  fetchSync(dir, remote || 'origin');

  if (!isDirectory(git())) {
    throw new Error('.git repository does not exist at: ' + git());
  }

  if (!fs.existsSync(git('FETCH_HEAD'))) {
    return ['master'];
  }

  var str = fs.readFileSync(git('FETCH_HEAD'), 'utf8');
  return parseBranches(str);
}

function fetch(cwd, remote, cb) {
  listRemotes(cwd, function(err, remotes) {
    if (err) {
      cb(err);
      return;
    }

    if (!remotes.hasOwnProperty(remote)) {
      cb(new Error('remote "' + remote + '" does not exist'));
      return;
    }

    cp.exec('git fetch ' + remote, {cwd: cwd}, function(err, stdout, stderr) {
      if (err) {
        cb(err, null, String(stderr).trim());
        return;
      }
      cb(null, String(stdout).trim());
      return;
    });
  });
}

function fetchSync(cwd, remote, options) {
  if (typeof remote !== 'string') {
    options = remote;
    remote = 'origin';
  }

  var opts = extend({}, execDefaults, options, {cwd: cwd});
  return cp.execSync('git fetch ' + remote, opts);
}

function parseBranch(str) {
  var regex = /branch\s*'([^']+)'\s*/;
  var match = regex.exec(str);
  if (match) {
    return match[1];
  }
}

function parseBranches(str) {
  var lines = str.split('\n');
  var res = [];
  for (var i = 0; i < lines.length; i++) {
    var branch = parseBranch(lines[i]);
    if (branch) {
      res.push(branch);
    }
  }
  return res;
}

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch (err) {}
  return false;
}
