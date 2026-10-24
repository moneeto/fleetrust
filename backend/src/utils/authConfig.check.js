const assert = require('node:assert');
const { envList } = require('./authConfig');

assert.deepStrictEqual(envList('a.apps.googleusercontent.com, b.apps.googleusercontent.com ,'), ['a.apps.googleusercontent.com', 'b.apps.googleusercontent.com']);
assert.deepStrictEqual(envList(undefined), []);
console.log('authConfig ok');
