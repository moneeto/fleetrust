const assert = require('node:assert');
const { userChangeError } = require('./userChangeError');

const admin = { idUser: 1, active: 1, code: 'ADM' };
const other = { idUser: 2, active: 1, code: 'ADM' };

assert.strictEqual(userChangeError(1, admin, { active: 0, code: 'ADM', otherActiveAdmins: 5 }), 'You cannot deactivate your own user.');
assert.strictEqual(userChangeError(1, other, { active: 0, code: 'ADM', otherActiveAdmins: 1 }), '');
assert.strictEqual(userChangeError(1, other, { active: 0, code: 'ADM', otherActiveAdmins: 0 }), 'The account needs at least one active administrator.');
assert.strictEqual(userChangeError(1, other, { active: 1, code: 'PIL', otherActiveAdmins: 0 }), 'The account needs at least one active administrator.');
assert.strictEqual(userChangeError(1, { idUser: 3, active: 1, code: 'PIL' }, { active: 0, code: 'PIL', otherActiveAdmins: 0 }), '');
assert.strictEqual(userChangeError(1, { idUser: 2, active: 0, code: 'ADM' }, { active: 1, code: 'ADM', otherActiveAdmins: 0 }), '');

console.log('userChangeError ok');
