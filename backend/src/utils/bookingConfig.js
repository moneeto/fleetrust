const DEFAULT_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

function parseWeekdays(value) {
    if (Array.isArray(value)) {
        return value.map(Number).filter((n) => n >= 0 && n <= 6);
    }
    if (Buffer.isBuffer(value)) {
        return parseWeekdays(value.toString('utf8'));
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parseWeekdays(parsed);
        } catch (_) { /* ignore */ }
        if (value.includes(',')) {
            return parseWeekdays(value.split(','));
        }
    }
    return DEFAULT_WEEKDAYS.slice();
}

function todayMiami() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year').value;
    const m = parts.find((p) => p.type === 'month').value;
    const d = parts.find((p) => p.type === 'day').value;
    return `${y}-${m}-${d}`;
}

function weekdayOfDate(dateStr) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
}

function isDateInWindow(dateStr, minDaysAhead, maxDaysAhead) {
    const today = todayMiami();
    const min = addDays(today, Number(minDaysAhead) || 0);
    const max = addDays(today, Number(maxDaysAhead) || 0);
    return dateStr >= min && dateStr <= max;
}

function addDays(dateStr, days) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + Number(days));
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

function formatHour(hour) {
    return String(hour || '').substring(0, 5);
}

function findPriceForPassengers(prices, passengers) {
    const pax = Number(passengers);
    const row = (prices || []).find((p) => Number(p.passengers) === pax);
    if (!row) return null;
    const price = Number(row.price);
    return Number.isFinite(price) ? price : null;
}

function normalizeProduct(product) {
    if (!product) return product;
    product.allowedWeekdays = parseWeekdays(product.allowedWeekdays);
    product.minDaysAhead = Number(product.minDaysAhead ?? 1);
    product.maxDaysAhead = Number(product.maxDaysAhead ?? 31);
    product.prices = (product.prices || [])
        .map((p) => ({
            passengers: Number(p.passengers),
            price: Number(p.price)
        }))
        .sort((a, b) => a.passengers - b.passengers);
    return product;
}

function serializeWeekdays(value) {
    return JSON.stringify(parseWeekdays(value));
}

// 1-2 words: first 4 letters of the first word. 3+ words: 2 letters of the first + initials of the 2nd and 3rd.
function codeFromTitle(title) {
    const words = String(title || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean);
    const code = words.length >= 3
        ? words[0].slice(0, 2) + words[1][0] + words[2][0]
        : (words[0] || '').slice(0, 4);
    return code.padEnd(4, 'X');
}

module.exports = {
    parseWeekdays,
    serializeWeekdays,
    todayMiami,
    weekdayOfDate,
    isDateInWindow,
    addDays,
    formatHour,
    findPriceForPassengers,
    normalizeProduct,
    codeFromTitle,
    DEFAULT_WEEKDAYS
};
