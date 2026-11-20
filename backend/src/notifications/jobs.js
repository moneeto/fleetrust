// Background jobs. They run every minute inside the API process.
//
// Safe with several API instances: each job first "claims" the work with an UPDATE
// that only one instance can win (see markReminderSent and markSummarySent).
//
// ponytail: setInterval is enough for one API process. If the API is down during the
// whole summary hour, that day's summary is skipped. Upgrade path: a real job queue.

const moment = require('moment');
const db = require('../models/notificationsModel.js');
const { notifyFlightReminder, notifyDailySummary } = require('./events.js');
const { REMINDER_MINUTES, JOB_INTERVAL_MS, STATUS_CONFIRMED, getBusinessNow } = require('./config.js');

async function sendFlightReminders() {
    const now = getBusinessNow();
    const until = moment(now.dateTime).add(REMINDER_MINUTES, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    const reservations = await db.getReservationsToRemind({ from: now.dateTime, until, confirmedStatus: STATUS_CONFIRMED });
    for (const reservation of reservations) {
        const isFirstToMark = await db.markReminderSent(reservation.idReservation);
        if (!isFirstToMark) continue;

        const minutesLeft = moment(reservation.startDate).diff(moment(now.dateTime), 'minutes');
        await notifyFlightReminder(reservation, minutesLeft);
    }
}

async function sendDailySummaries() {
    const now = getBusinessNow();

    const accounts = await db.getAccountsToSummarize({ hour: now.hour, today: now.date });
    for (const { idAccount } of accounts) {
        const isFirstToMark = await db.markSummarySent({ idAccount, today: now.date });
        if (!isFirstToMark) continue;

        const flights = await db.getFlightsOfDay({ idAccount, date: now.date, confirmedStatus: STATUS_CONFIRMED });
        await notifyDailySummary(idAccount, flights);
    }
}

// Runs a job every minute. If the previous run is still going, the new run is skipped.
function runEveryMinute(name, job) {
    let isRunning = false;
    setInterval(async () => {
        if (isRunning) return;
        isRunning = true;
        try {
            await job();
        } catch (e) {
            console.log(`[${name}] failed:`, e);
        } finally {
            isRunning = false;
        }
    }, JOB_INTERVAL_MS);
}

function startNotificationJobs() {
    runEveryMinute('flight reminders', sendFlightReminders);
    runEveryMinute('daily summaries', sendDailySummaries);
}

module.exports = { startNotificationJobs, sendFlightReminders, sendDailySummaries };
