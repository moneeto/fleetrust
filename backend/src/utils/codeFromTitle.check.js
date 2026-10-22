const assert = require('node:assert');
const { codeFromTitle } = require('./bookingConfig');

assert.strictEqual(codeFromTitle('Discovery Flight'), 'DISC');
assert.strictEqual(codeFromTitle('New People Flight'), 'NEPF');
assert.strictEqual(codeFromTitle('Fly'), 'FLYX');
assert.strictEqual(codeFromTitle('Vuelo Ñandú'), 'VUEL');
assert.strictEqual(codeFromTitle('  sunset   tour '), 'SUNS');

console.log('codeFromTitle ok');
