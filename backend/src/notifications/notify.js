// The two functions the rest of the app uses to send a push notification.
//
//   notify(idUser, title, message)        -> to one user (any role, so pilots can use it later)
//   notifyAdmins(idAccount, title, message) -> to every administrator of an account
//
// notifyAdmins also takes exceptIdUser (5th argument): that user is skipped,
// e.g. the person who just made the booking.
//
// Both take an optional 4th argument, data, e.g. { url: '/operations/bookings' }:
// the app opens that page when the user taps the notification.
// They never throw: a failed notification must not break the request that triggered it.

const db = require('../models/notificationsModel.js');
const { sendPushMessage } = require('./pushSender.js');

async function sendToTokens(tokens, title, message, data) {
    const results = await Promise.all(tokens.map((token) => sendPushMessage(token, title, message, data)));
    const deadTokens = tokens.filter((token, index) => results[index] === 'invalid_token');
    await db.deleteDeviceTokens(deadTokens);
}

async function notify(idUser, title, message, data = {}) {
    try {
        const tokens = await db.getDeviceTokensByUser(idUser);
        await sendToTokens(tokens, title, message, data);
    } catch (e) {
        console.log('[notify] failed for user', idUser, e);
    }
}

async function notifyAdmins(idAccount, title, message, data = {}, exceptIdUser = 0) {
    try {
        const tokens = await db.getAdminDeviceTokens(idAccount, exceptIdUser);
        await sendToTokens(tokens, title, message, data);
    } catch (e) {
        console.log('[notifyAdmins] failed for account', idAccount, e);
    }
}

module.exports = { notify, notifyAdmins };
