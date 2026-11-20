const express = require('express');
const router = express.Router();
const db = require('../models/notificationsModel.js');
const withAuth = require('../middleware/withAuth.js');
const checkAccount = require('../middleware/checkAccount.js');

router.post('/registerDevice', withAuth, checkAccount, registerDevice);
router.post('/removeDevice', withAuth, checkAccount, removeDevice);
router.get('/settings', withAuth, checkAccount, getSettings);
router.post('/settings', withAuth, checkAccount, saveSettings);

const PLATFORMS = ['android', 'ios', 'web'];

function isAdmin(req) {
    return req.code === 'ADM';
}

function sendError(res, e, fallbackMessage) {
    console.log(e);
    const message = typeof e === 'string' ? e : fallbackMessage;
    res.status(400).send({ success: false, message });
}

async function registerDevice(req, res) {
    try {
        const { token, platform = 'android' } = req.body;
        if (typeof token !== 'string' || !token || token.length > 255) throw 'Invalid device token.';
        if (!PLATFORMS.includes(platform)) throw 'Invalid platform.';

        await db.saveDeviceToken({ idUser: req.idUser, token, platform });
        res.send({ success: true });
    } catch (e) {
        sendError(res, e, 'Could not register the device.');
    }
}

async function removeDevice(req, res) {
    try {
        const { token } = req.body;
        if (typeof token !== 'string' || !token) throw 'Invalid device token.';

        await db.deleteDeviceToken({ idUser: req.idUser, token });
        res.send({ success: true });
    } catch (e) {
        sendError(res, e, 'Could not remove the device.');
    }
}

async function getSettings(req, res) {
    try {
        const settings = await db.getNotificationSettings({ idUser: req.idUser, idAccount: req.idAccount });
        res.send({
            success: true,
            notificationsEnabled: Boolean(settings.notificationsEnabled),
            dailySummaryHour: settings.dailySummaryHour,
            canEditDailySummaryHour: isAdmin(req),
        });
    } catch (e) {
        sendError(res, e, 'Could not load the notification settings.');
    }
}

// Send only the fields you want to change.
async function saveSettings(req, res) {
    try {
        const { notificationsEnabled, dailySummaryHour } = req.body;

        if (notificationsEnabled !== undefined) {
            await db.saveNotificationsEnabled({ idUser: req.idUser, notificationsEnabled: Boolean(notificationsEnabled) });
        }

        if (dailySummaryHour !== undefined) {
            if (!isAdmin(req)) throw 'Only an administrator can change the daily summary hour.';
            const hour = Number(dailySummaryHour);
            if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw 'The hour must be between 0 and 23.';
            await db.saveDailySummaryHour({ idAccount: req.idAccount, dailySummaryHour: hour });
        }

        res.send({ success: true });
    } catch (e) {
        sendError(res, e, 'Could not save the notification settings.');
    }
}

module.exports = router;
