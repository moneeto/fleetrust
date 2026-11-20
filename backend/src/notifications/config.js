// Settings shared by the whole notifications module.

// Time zone of the business. Reservation dates are saved as local time in this zone.
const BUSINESS_TIMEZONE = 'America/New_York';

// A flight reminder is sent when the flight starts in this many minutes or less.
const REMINDER_MINUTES = 60;

// How often the background jobs look for work.
const JOB_INTERVAL_MS = 60 * 1000;

// reservations.idStatus of a confirmed reservation.
const STATUS_CONFIRMED = 3;

// Where the app opens when the user taps a notification.
const URL_BOOKINGS = '/operations/bookings';
const URL_CALENDAR = '/operations/calendar';

// Returns the current time in the business time zone: { date: 'YYYY-MM-DD', dateTime: 'YYYY-MM-DD HH:mm:ss', hour: 0-23 }
function getBusinessNow(now = new Date()) {
    const dateTime = now.toLocaleString('sv-SE', { timeZone: BUSINESS_TIMEZONE });
    return {
        date: dateTime.slice(0, 10),
        dateTime,
        hour: Number(dateTime.slice(11, 13)),
    };
}

module.exports = {
    BUSINESS_TIMEZONE,
    REMINDER_MINUTES,
    JOB_INTERVAL_MS,
    STATUS_CONFIRMED,
    URL_BOOKINGS,
    URL_CALENDAR,
    getBusinessNow,
};
