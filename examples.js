var branches = require('./');

branches('.', function() {
  console.log(arguments);
});

console.log(branches.sync('.'));
