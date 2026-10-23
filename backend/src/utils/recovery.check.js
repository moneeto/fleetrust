const assert = require('node:assert');
const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { otpExpiresAt } = require('./otp');

function recoveryHash(token) {
    return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

async function dbCheck() {
    const { pool } = require('../helpers/conexion-mysql');
    const auth = require('../models/authModel');
    const conn = await new Promise((resolve, reject) => {
        pool.getConnection((err, c) => err ? reject(err) : resolve(c));
    });
    try {
        await new Promise((resolve, reject) => conn.beginTransaction((err) => err ? reject(err) : resolve()));
        const users = await auth.getUserByEmail(conn, { email: 'recovery-check@example.com' });
        let idUser = users[0] && users[0].idUser;
        if (!idUser) {
            const account = await auth.createAccount(conn, { name: 'recovery-check' });
            const roles = await auth.getRoleByCode(conn, 'ADM');
            const created = await auth.createUser(conn, {
                username: 'recovery-check@example.com',
                email: 'recovery-check@example.com',
                password: 'hash',
                idRole: roles[0].idRole,
                idAccount: account.insertId,
                active: 1
            });
            idUser = created.insertId;
        }

        const oldToken = 'old-token';
        const liveToken = 'live-token';
        await auth.deactivateRecoveryForUser(conn, { idUser });
        await auth.insertRecovery(conn, { idUser, token: recoveryHash(oldToken), expiresAt: '2000-01-01 00:00:00' });
        await auth.insertRecovery(conn, { idUser, token: recoveryHash(liveToken), expiresAt: otpExpiresAt() });

        const expired = await auth.getActiveRecovery(conn, { token: recoveryHash(oldToken) });
        const live = await auth.getActiveRecovery(conn, { token: recoveryHash(liveToken) });
        assert.strictEqual(expired.length, 0);
        assert.strictEqual(live.length, 1);

        await auth.deactivateRecoveryById(conn, live[0].idRecovery);
        const used = await auth.getActiveRecovery(conn, { token: recoveryHash(liveToken) });
        assert.strictEqual(used.length, 0);
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
    .then(() => console.log('recovery ok'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
