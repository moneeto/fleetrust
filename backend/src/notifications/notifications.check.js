// Run with: node src/notifications/notifications.check.js
const assert = require('node:assert');
const { getBusinessNow } = require('./config');
const { getFlightSummary, getDailySummaryMessage } = require('./events');

// 2026-11-20 03:30 UTC is 2026-11-19 22:30 in New York (EST, UTC-5).
const now = getBusinessNow(new Date('2026-11-20T03:30:00Z'));
assert.strictEqual(now.date, '2026-11-19');
assert.strictEqual(now.dateTime, '2026-11-19 22:30:00');
assert.strictEqual(now.hour, 22);

assert.strictEqual(
    getFlightSummary({ service: 'Sunset', startDate: '2026-11-20 14:30:00', pilotName: 'Ana', aircraft: 'N123AB' }),
    'Sunset · 2026-11-20 14:30 · Pilot Ana · N123AB'
);
assert.strictEqual(getFlightSummary({ startDate: '2026-11-20 14:30:00' }), '2026-11-20 14:30');

assert.strictEqual(getDailySummaryMessage([]), 'No flights today.');
assert.strictEqual(
    getDailySummaryMessage([{ startDate: '2026-11-20 09:00:00' }, { startDate: '2026-11-20 11:00:00' }]),
    '2 flight(s) today. The first one is at 09:00.'
);
console.log('notifications checks passed');
