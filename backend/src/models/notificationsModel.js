// Database access for push notifications.
// Uses pool.promise(), so these functions do not need a connection from the caller
// and can also be used by background jobs.

const { pool } = require('../helpers/conexion-mysql.js');

const database = pool.promise();

async function getRows(sql, params = []) {
    const [rows] = await database.query(sql, params);
    return rows;
}

// ---- Device tokens ----

// Saves the phone token. If the token already exists it now belongs to this user.
async function saveDeviceToken({ idUser, token, platform }) {
    await database.query(
        `INSERT INTO device_tokens (idUser, token, platform) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE idUser = VALUES(idUser), platform = VALUES(platform)`,
        [idUser, token, platform]
    );
}

async function deleteDeviceToken({ idUser, token }) {
    await database.query(`DELETE FROM device_tokens WHERE token = ? AND idUser = ?`, [token, idUser]);
}

async function deleteDeviceTokens(tokens) {
    if (!tokens.length) return;
    await database.query(`DELETE FROM device_tokens WHERE token IN (?)`, [tokens]);
}

// Only users who are active and have notifications turned on get tokens back.
async function getDeviceTokensByUser(idUser) {
    const rows = await getRows(
        `SELECT d.token
         FROM device_tokens d
         INNER JOIN users u ON u.idUser = d.idUser
         WHERE u.idUser = ? AND u.active = 1 AND u.notificationsEnabled = 1`,
        [idUser]
    );
    return rows.map((row) => row.token);
}

// Same as above for every administrator (role ADM) of an account, except the user exceptIdUser.
async function getAdminDeviceTokens(idAccount, exceptIdUser = 0) {
    const rows = await getRows(
        `SELECT d.token
         FROM device_tokens d
         INNER JOIN users u ON u.idUser = d.idUser
         INNER JOIN roles r ON r.idRole = u.idRole
         WHERE u.idAccount = ? AND r.code = 'ADM' AND u.idUser <> ? AND u.active = 1 AND u.notificationsEnabled = 1`,
        [idAccount, exceptIdUser]
    );
    return rows.map((row) => row.token);
}

// ---- Settings ----

async function getNotificationSettings({ idUser, idAccount }) {
    const rows = await getRows(
        `SELECT u.notificationsEnabled, a.dailySummaryHour
         FROM users u
         INNER JOIN accounts a ON a.idAccount = u.idAccount
         WHERE u.idUser = ? AND u.idAccount = ?`,
        [idUser, idAccount]
    );
    return rows[0];
}

async function saveNotificationsEnabled({ idUser, notificationsEnabled }) {
    await database.query(`UPDATE users SET notificationsEnabled = ? WHERE idUser = ?`, [notificationsEnabled ? 1 : 0, idUser]);
}

async function saveDailySummaryHour({ idAccount, dailySummaryHour }) {
    await database.query(`UPDATE accounts SET dailySummaryHour = ? WHERE idAccount = ?`, [dailySummaryHour, idAccount]);
}

// ---- Flight reminders ----

// Confirmed reservations that start between "from" and "until" and have no reminder yet.
async function getReservationsToRemind({ from, until, confirmedStatus }) {
    return getRows(
        `SELECT r.idReservation, r.idAccount, r.startDate, r.passengers,
                s.title AS service, p.pilotName, a.aircraft
         FROM reservations r
         LEFT JOIN services s ON s.idService = r.idService
         LEFT JOIN pilots p ON p.idPilot = r.idPilot
         LEFT JOIN aircrafts a ON a.idAircraft = r.idAircraft
         WHERE r.idStatus = ? AND r.reminderSentAt IS NULL AND r.startDate > ? AND r.startDate <= ?`,
        [confirmedStatus, from, until]
    );
}

// Returns true only for the one caller that marks it first, so the reminder is never sent twice.
async function markReminderSent(idReservation) {
    const [result] = await database.query(
        `UPDATE reservations SET reminderSentAt = NOW() WHERE idReservation = ? AND reminderSentAt IS NULL`,
        [idReservation]
    );
    return result.affectedRows === 1;
}

// ---- Daily summary ----

// Accounts whose summary hour is now and that have not received today's summary yet.
async function getAccountsToSummarize({ hour, today }) {
    return getRows(
        `SELECT idAccount FROM accounts
         WHERE active = 1 AND dailySummaryHour = ? AND (lastDailySummaryDate IS NULL OR lastDailySummaryDate < ?)`,
        [hour, today]
    );
}

// Returns true only for the one caller that marks it first.
async function markSummarySent({ idAccount, today }) {
    const [result] = await database.query(
        `UPDATE accounts SET lastDailySummaryDate = ?
         WHERE idAccount = ? AND (lastDailySummaryDate IS NULL OR lastDailySummaryDate < ?)`,
        [today, idAccount, today]
    );
    return result.affectedRows === 1;
}

async function getFlightsOfDay({ idAccount, date, confirmedStatus }) {
    return getRows(
        `SELECT startDate FROM reservations
         WHERE idAccount = ? AND idStatus = ? AND DATE(startDate) = ?
         ORDER BY startDate`,
        [idAccount, confirmedStatus, date]
    );
}

module.exports = {
    saveDeviceToken,
    deleteDeviceToken,
    deleteDeviceTokens,
    getDeviceTokensByUser,
    getAdminDeviceTokens,
    getNotificationSettings,
    saveNotificationsEnabled,
    saveDailySummaryHour,
    getReservationsToRemind,
    markReminderSent,
    getAccountsToSummarize,
    markSummarySent,
    getFlightsOfDay,
};
