const assert = require('node:assert');
const { slotsFromIntervals } = require('./bookingConfig');

const slots = slotsFromIntervals([
    { hourFrom: '09:00', hourTo: '10:00' },
    { hourFrom: '09:30', hourTo: '10:00' },
    { hourFrom: '14:00', hourTo: '16:00' }
], 60);

assert.deepStrictEqual(slots, ['09:00', '14:00', '15:00']);
