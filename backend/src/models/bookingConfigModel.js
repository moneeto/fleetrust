const { normalizeProduct, formatHour } = require('../utils/bookingConfig');

function query(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServicePrices(conn, ids) {
    if (!ids || ids.length === 0) return [];
    return query(
        conn,
        `SELECT idService, passengers, price
         FROM services_prices
         WHERE idService IN (?)
         ORDER BY passengers ASC`,
        [ids]
    );
}

async function getServiceHours(conn, idService) {
    const rows = await query(
        conn,
        `SELECT TIME_FORMAT(hour, '%H:%i') AS hour FROM services_hours WHERE idService = ?`,
        [idService]
    );
    return rows.map((r) => formatHour(r.hour));
}

async function getServiceConfigByCode(conn, code) {
    const rows = await query(
        conn,
        `SELECT idService, code, minDaysAhead, maxDaysAhead, allowedWeekdays
         FROM services WHERE code = ? AND deleted = 0 LIMIT 1`,
        [code]
    );
    if (!rows.length) return null;
    const product = rows[0];
    const [prices, hours] = await Promise.all([
        getServicePrices(conn, [product.idService]),
        getServiceHours(conn, product.idService)
    ]);
    product.prices = prices.map((p) => ({
        passengers: Number(p.passengers),
        price: Number(p.price)
    }));
    product.hours = hours;
    product.kind = 'service';
    return normalizeProduct(product);
}

async function resolveProductConfig(conn, { experienceCode, routeCode, serviceCode }) {
    const code = (serviceCode || experienceCode || routeCode || '').toString().trim();
    if (!code) return null;
    return getServiceConfigByCode(conn, code);
}

function filterHoursForProduct(occupancyHours, productConfig) {
    const allowed = new Set((productConfig.hours || []).map(formatHour));
    return (occupancyHours || []).filter((item) => allowed.has(formatHour(item.hour)));
}

module.exports = {
    getServiceConfigByCode,
    resolveProductConfig,
    filterHoursForProduct
};
