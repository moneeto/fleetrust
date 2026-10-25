function query(conn, sql, params) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

const userSelect = `SELECT a.idUser, a.username, a.email, a.password, a.name, a.surname, a.idRole, a.idAccount,
                    a.active, a.resetPassword, a.googleId, b.role, b.code
                FROM users a
                INNER JOIN roles b ON b.idRole = a.idRole`;

async function getUserByEmail(conn, p) {
    return query(conn, `${userSelect} WHERE a.email = ?`, [p.email]);
}

async function getUserByGoogleId(conn, p) {
    return query(conn, `${userSelect} WHERE a.googleId = ?`, [p.googleId]);
}

async function getUserById(conn, p) {
    return query(conn, `${userSelect} WHERE a.idUser = ?`, [p.idUser]);
}

async function linkGoogle(conn, p) {
    return query(conn, `UPDATE users SET googleId = ?, updatedBy = ? WHERE idUser = ?`, [p.googleId, p.idUser, p.idUser]);
}

async function getBiometricStatus(conn, p) {
    const sql = `SELECT u.askBiometric, (SELECT COUNT(*) FROM passkeys WHERE idUser = u.idUser) AS passkeys
                FROM users u
                WHERE u.idUser = ?`;
    return query(conn, sql, [p.idUser]);
}

async function getProfile(conn, p) {
    return query(conn, `SELECT name, surname, email, createdAt, (password IS NOT NULL) AS hasPassword FROM users WHERE idUser = ?`, [p.idUser]);
}

async function updateProfile(conn, p) {
    return query(conn, `UPDATE users SET name = ?, surname = ?, updatedBy = ? WHERE idUser = ?`, [p.name, p.surname, p.idUser, p.idUser]);
}

async function deletePasskeys(conn, p) {
    return query(conn, `DELETE FROM passkeys WHERE idUser = ?`, [p.idUser]);
}

async function setAskBiometric(conn, p) {
    return query(conn, `UPDATE users SET askBiometric = ?, updatedBy = ? WHERE idUser = ?`, [p.value, p.idUser, p.idUser]);
}

async function getPasskeysByUser(conn, p) {
    return query(conn, `SELECT credentialId, transports FROM passkeys WHERE idUser = ?`, [p.idUser]);
}

async function getPasskeyByCredential(conn, p) {
    return query(conn, `SELECT idPasskey, idUser, credentialId, publicKey, counter, transports FROM passkeys WHERE credentialId = ?`, [p.credentialId]);
}

async function insertPasskey(conn, p) {
    const sql = `INSERT INTO passkeys (idUser, credentialId, publicKey, counter, transports) VALUES (?, ?, ?, ?, ?)`;
    return query(conn, sql, [p.idUser, p.credentialId, p.publicKey, p.counter, p.transports]);
}

async function updatePasskeyCounter(conn, p) {
    return query(conn, `UPDATE passkeys SET counter = ? WHERE idPasskey = ?`, [p.counter, p.idPasskey]);
}

async function getActiveUserInAccount(conn, p) {
    const sql = `SELECT idUser FROM users WHERE idUser = ? AND idAccount = ? AND active = 1`;
    return query(conn, sql, [p.idUser, p.idAccount]);
}

async function getRoleByCode(conn, code) {
    return query(conn, `SELECT idRole FROM roles WHERE code = ? LIMIT 1`, [code]);
}

async function createAccount(conn, p) {
    return query(conn, `INSERT INTO accounts (name, active, show_setup_modal) VALUES (?, 1, ?)`, [p.name, p.showSetupModal]);
}

async function getSetupStatus(conn, idAccount) {
    const sql = `SELECT
                    a.show_setup_modal AS showSetupModal,
                    (SELECT COUNT(*) FROM services WHERE idAccount = a.idAccount AND deleted = 0 AND code <> 'MANUAL') AS services,
                    (SELECT COUNT(*) FROM aircrafts WHERE idAccount = a.idAccount AND (deleted = 0 OR deleted IS NULL)) AS aircrafts,
                    (SELECT COUNT(*) FROM pilots WHERE idAccount = a.idAccount AND deleted = 0) AS pilots,
                    (SELECT COUNT(*) FROM addons WHERE idAccount = a.idAccount AND deleted = 0) AS addons
                FROM accounts a
                WHERE a.idAccount = ?`;
    return query(conn, sql, [idAccount]);
}

async function setSetupModal(conn, p) {
    return query(conn, `UPDATE accounts SET show_setup_modal = ?, updatedBy = ? WHERE idAccount = ?`, [p.value, p.idUser, p.idAccount]);
}

async function createUser(conn, p) {
    const sql = `INSERT INTO users (username, email, password, googleId, idRole, idAccount, active, resetPassword, askBiometric)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`;
    return query(conn, sql, [p.username, p.email, p.password, p.googleId, p.idRole, p.idAccount, p.active, p.askBiometric]);
}

async function updatePassword(conn, p) {
    return query(conn, `UPDATE users SET password = ?, resetPassword = 0, updatedBy = ? WHERE idUser = ? AND active = 1`, [p.password, p.idUser, p.idUser]);
}

async function deactivateRecoveryForUser(conn, p) {
    return query(conn, `UPDATE recovery_codes SET active = 0 WHERE idUser = ? AND active = 1`, [p.idUser]);
}

async function insertRecovery(conn, p) {
    return query(conn, `INSERT INTO recovery_codes (idUser, token, expiresAt, active) VALUES (?, ?, ?, 1)`, [p.idUser, p.token, p.expiresAt]);
}

async function getActiveRecovery(conn, p) {
    const sql = `SELECT idRecovery, idUser FROM recovery_codes WHERE token = ? AND active = 1 AND expiresAt > NOW()`;
    return query(conn, sql, [p.token]);
}

async function deactivateRecoveryById(conn, idRecovery) {
    return query(conn, `UPDATE recovery_codes SET active = 0 WHERE idRecovery = ?`, [idRecovery]);
}

async function deactivateExpiredOtp(conn) {
    return query(conn, `UPDATE otp_codes SET active = 0 WHERE active = 1 AND expiresAt < NOW()`, []);
}

async function deactivateOtpForEmail(conn, p) {
    return query(conn, `UPDATE otp_codes SET active = 0 WHERE email = ? AND purpose = ? AND active = 1`, [p.email, p.purpose]);
}

async function insertOtp(conn, p) {
    const sql = `INSERT INTO otp_codes (email, code, purpose, expiresAt, active, passwordHash) VALUES (?, ?, ?, ?, 1, ?)`;
    return query(conn, sql, [p.email, p.code, p.purpose, p.expiresAt, p.passwordHash || null]);
}

async function getActiveOtps(conn, p) {
    const sql = `SELECT idOtp, email, code, purpose, expiresAt, active, passwordHash
                FROM otp_codes
                WHERE email = ? AND purpose = ? AND active = 1`;
    return query(conn, sql, [p.email, p.purpose]);
}

async function deactivateOtpById(conn, idOtp) {
    return query(conn, `UPDATE otp_codes SET active = 0 WHERE idOtp = ?`, [idOtp]);
}

module.exports = {
    getUserByEmail,
    getUserByGoogleId,
    getUserById,
    linkGoogle,
    getBiometricStatus,
    getProfile,
    updateProfile,
    deletePasskeys,
    setAskBiometric,
    getPasskeysByUser,
    getPasskeyByCredential,
    insertPasskey,
    updatePasskeyCounter,
    getActiveUserInAccount,
    getRoleByCode,
    createAccount,
    getSetupStatus,
    setSetupModal,
    createUser,
    updatePassword,
    deactivateRecoveryForUser,
    insertRecovery,
    getActiveRecovery,
    deactivateRecoveryById,
    deactivateExpiredOtp,
    deactivateOtpForEmail,
    insertOtp,
    getActiveOtps,
    deactivateOtpById
};
