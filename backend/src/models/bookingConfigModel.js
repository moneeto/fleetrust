const { normalizeProduct, serviceSlots } = require('../utils/bookingConfig');

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

async function getServiceConfigByCode(conn, code, idAccount) {
    const rows = await query(
        conn,
        `SELECT idService, code, minDaysAhead, maxDaysAhead, allowedWeekdays, durationMinutes,
                TIME_FORMAT(startTime, '%H:%i') AS startTime,
                TIME_FORMAT(endTime, '%H:%i') AS endTime
         FROM services WHERE code = ? AND idAccount = ? AND deleted = 0 LIMIT 1`,
        [code, idAccount]
    );
    if (!rows.length) return null;
    const product = rows[0];
    const prices = await getServicePrices(conn, [product.idService]);
    product.durationMinutes = Number(product.durationMinutes);
    product.prices = prices.map((p) => ({
        passengers: Number(p.passengers),
        price: Number(p.price)
    }));
    product.hours = serviceSlots(product.startTime, product.endTime, product.durationMinutes);
    product.kind = 'service';
    return normalizeProduct(product);
}

async function resolveProductConfig(conn, { experienceCode, serviceCode, idAccount }) {
    const code = (serviceCode || experienceCode || '').toString().trim();
    if (!code) return null;
    return getServiceConfigByCode(conn, code, idAccount);
}

module.exports = {
    getServiceConfigByCode,
    resolveProductConfig
};
