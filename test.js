'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var assert = require('assert');
var rimraf = require('rimraf');
var gfc = require('gfc');
var branches = require('./');
var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

describe('list-git-branches', function() {
  describe('main export', function() {
    it('should export a function', function() {
      assert.equal(typeof branches, 'function');
    });

    it('should expose a .sync method', function() {
      assert.equal(typeof branches.sync, 'function');
    });
  });

  describe('branches', function() {
    beforeEach(function(cb) {
      if (fs.existsSync(fixtures())) {
        rimraf.sync(fixtures());
      }
      gfc(fixtures(), cb);
    });

    afterEach(function(cb) {
      rimraf(fixtures(), cb);
    });

    it('should get branches (async)', function(cb) {
      cp.execSync('git branch foo', {cwd: fixtures()});
      cp.execSync('git branch bar', {cwd: fixtures()});
      cp.execSync('git branch baz', {cwd: fixtures()});

      branches(fixtures(), function(err, names) {
        if (err) {
          cb(err);
          return;
        }
        assert(names.indexOf('foo') !== -1);
        assert(names.indexOf('bar') !== -1);
        assert(names.indexOf('baz') !== -1);
        assert(names.indexOf('master') !== -1);
        cb();
      });
    });

    it('should get branches (sync)', function() {
      cp.execSync('git branch foo', {cwd: fixtures()});
      cp.execSync('git branch bar', {cwd: fixtures()});
      cp.execSync('git branch baz', {cwd: fixtures()});

      var names = branches.sync(fixtures());
      assert(names.indexOf('foo') !== -1);
      assert(names.indexOf('bar') !== -1);
      assert(names.indexOf('baz') !== -1);
      assert(names.indexOf('master') !== -1);
    });
  });
});
