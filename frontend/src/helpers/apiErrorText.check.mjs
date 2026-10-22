import assert from 'node:assert';
import { apiErrorText } from './apiErrorText.mjs';

const generic = 'Something went wrong. Please try again.';

assert.strictEqual(apiErrorText({ mensaje: 'Invalid service code' }), 'Invalid service code');
assert.strictEqual(apiErrorText({ message: 'Missing date.' }), 'Missing date.');
assert.strictEqual(apiErrorText({}), generic);
assert.strictEqual(apiErrorText({ message: { code: 1 } }), generic);
assert.strictEqual(apiErrorText({ sqlMessage: 'Unknown column x', message: 'Unknown column x' }), generic);
assert.strictEqual(apiErrorText({ message: "You have an error in your SQL syntax" }), generic);

console.log('apiErrorText ok');
