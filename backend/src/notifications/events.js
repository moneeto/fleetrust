// One function per notification the app sends. The texts live here and nowhere else.
// To add a new notification: write a function here and call it where the event happens.

const { notifyAdmins } = require('./notify.js');
const { URL_BOOKINGS, URL_CALENDAR } = require('./config.js');

// "Sunset Flight · 2026-11-20 14:30 · Pilot Ana · N123AB"
function getFlightSummary(reservation) {
    return [
        reservation.service,
        String(reservation.startDate).slice(0, 16),
        reservation.pilotName && `Pilot ${reservation.pilotName}`,
        reservation.aircraft,
    ].filter(Boolean).join(' · ');
}

function getDailySummaryMessage(flights) {
    if (flights.length === 0) return 'No flights today.';
    const firstTime = String(flights[0].startDate).slice(11, 16);
    return `${flights.length} flight(s) today. The first one is at ${firstTime}.`;
}

// reservation = a row with idAccount, startDate, service, pilotName, aircraft
// idAuthor = the user who did it. They do not get the notification.
function notifyNewBooking(reservation, idAuthor) {
    return notifyAdmins(reservation.idAccount, 'New booking', getFlightSummary(reservation), { url: URL_BOOKINGS }, idAuthor);
}

function notifyCancellation(reservation, idAuthor) {
    return notifyAdmins(reservation.idAccount, 'Booking cancelled', getFlightSummary(reservation), { url: URL_BOOKINGS }, idAuthor);
}

function notifyFlightReminder(reservation, minutesLeft) {
    const message = `Starts in ${minutesLeft} min. ${getFlightSummary(reservation)}`;
    return notifyAdmins(reservation.idAccount, 'Upcoming flight', message, { url: URL_BOOKINGS });
}

function notifyDailySummary(idAccount, flights) {
    return notifyAdmins(idAccount, 'Today\'s flights', getDailySummaryMessage(flights), { url: URL_CALENDAR });
}

module.exports = {
    getFlightSummary,
    getDailySummaryMessage,
    notifyNewBooking,
    notifyCancellation,
    notifyFlightReminder,
    notifyDailySummary,
};
