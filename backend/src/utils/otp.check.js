const assert = require('node:assert');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { otpAccepts, stillActiveAfterIssue, newOtpCode, otpExpiresAt } = require('./otp');

const now = new Date('2026-10-22T12:00:00');
assert.strictEqual(otpAccepts({ purpose: 'REGISTER', active: 1, expiresAt: '2026-10-22 11:59:00' }, 'REGISTER', now), false);
assert.strictEqual(otpAccepts({ purpose: 'REGISTER', active: 0, expiresAt: '2026-10-22 12:30:00' }, 'REGISTER', now), false);
assert.strictEqual(otpAccepts({ purpose: 'RESET_PASSWORD', active: 1, expiresAt: '2026-10-22 12:30:00' }, 'REGISTER', now), false);
assert.strictEqual(otpAccepts({ purpose: 'REGISTER', active: 1, expiresAt: '2026-10-22 12:30:00' }, 'REGISTER', now), true);

const kept = stillActiveAfterIssue([
    { email: 'a@b.c', purpose: 'REGISTER', active: 1 },
    { email: 'a@b.c', purpose: 'RESET_PASSWORD', active: 1 },
], 'a@b.c', 'REGISTER');
assert.strictEqual(kept.some((row) => row.purpose === 'REGISTER'), false);
assert.strictEqual(kept.some((row) => row.purpose === 'RESET_PASSWORD' && Number(row.active) === 1), true);
assert.strictEqual(newOtpCode().length, 6);

async function dbCheck() {
    const { pool } = require('../helpers/conexion-mysql');
    const auth = require('../models/authModel');
    const pilots = require('../models/pilotsModel');
    const conn = await new Promise((resolve, reject) => {
        pool.getConnection((err, c) => err ? reject(err) : resolve(c));
    });
    try {
        await new Promise((resolve, reject) => conn.beginTransaction((err) => err ? reject(err) : resolve()));
        const email = 'otp-check@example.com';
        await auth.insertOtp(conn, { email, code: 'hash-old', purpose: 'REGISTER', expiresAt: '2000-01-01 00:00:00' });
        await auth.insertOtp(conn, { email, code: 'hash-reset', purpose: 'RESET_PASSWORD', expiresAt: otpExpiresAt() });
        await auth.insertOtp(conn, { email, code: 'hash-live', purpose: 'REGISTER', expiresAt: otpExpiresAt() });
        await auth.deactivateExpiredOtp(conn);
        let registerRows = await auth.getActiveOtps(conn, { email, purpose: 'REGISTER' });
        assert.strictEqual(registerRows.some((row) => row.code === 'hash-old'), false);
        assert.strictEqual(registerRows.some((row) => row.code === 'hash-live'), true);

        await auth.deactivateOtpForEmail(conn, { email, purpose: 'REGISTER' });
        registerRows = await auth.getActiveOtps(conn, { email, purpose: 'REGISTER' });
        const resetRows = await auth.getActiveOtps(conn, { email, purpose: 'RESET_PASSWORD' });
        assert.strictEqual(registerRows.length, 0);
        assert.strictEqual(resetRows.length, 1);

        await auth.deactivateOtpById(conn, resetRows[0].idOtp);
        const used = await auth.getActiveOtps(conn, { email, purpose: 'RESET_PASSWORD' });
        assert.strictEqual(used.length, 0);

        const account = await auth.createAccount(conn, { name: 'otp-check-account' });
        await pilots.createPilot(conn, {
            pilotName: 'Other account pilot',
            pilotPicture: null,
            phoneNumber: null,
            active: 1,
            idAccount: account.insertId
        });
        const visible = await pilots.getPilots(conn, 0, 1);
        const own = await pilots.getPilots(conn, 0, account.insertId);
        assert.strictEqual(visible.some((row) => row.pilotName === 'Other account pilot'), false);
        assert.strictEqual(own.some((row) => row.pilotName === 'Other account pilot'), true);
        await new Promise((resolve) => conn.rollback(() => resolve()));
    } catch (error) {
        await new Promise((resolve) => conn.rollback(() => resolve()));
        throw error;
    } finally {
        conn.release();
    }
    pool.end();
}

dbCheck()
    .then(() => console.log('otp ok'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
