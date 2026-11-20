// Public entry point of the notifications module.
// Other files only import from here:  const { notify } = require('../notifications');

const { notify, notifyAdmins } = require('./notify.js');
const { notifyNewBooking, notifyCancellation } = require('./events.js');
const { startNotificationJobs } = require('./jobs.js');

module.exports = {
    notify,
    notifyAdmins,
    notifyNewBooking,
    notifyCancellation,
    startNotificationJobs,
};
