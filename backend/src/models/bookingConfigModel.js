const { normalizeProduct, formatHour } = require('../utils/bookingConfig');

function query(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getExperiencePrices(conn, ids) {
    if (!ids || ids.length === 0) return [];
    return query(
        conn,
        `SELECT idExperience, passengers, price
         FROM experience_prices
         WHERE idExperience IN (?)
         ORDER BY passengers ASC`,
        [ids]
    );
}

async function getRoutePrices(conn, ids) {
    if (!ids || ids.length === 0) return [];
    return query(
        conn,
        `SELECT idRoute, passengers, price
         FROM route_prices
         WHERE idRoute IN (?)
         ORDER BY passengers ASC`,
        [ids]
    );
}

async function getExperienceHours(conn, idExperience) {
    const rows = await query(
        conn,
        `SELECT TIME_FORMAT(hour, '%H:%i') AS hour FROM experience_hours WHERE idExperience = ?`,
        [idExperience]
    );
    return rows.map((r) => formatHour(r.hour));
}

async function getRouteHours(conn, idRoute) {
    const rows = await query(
        conn,
        `SELECT TIME_FORMAT(hour, '%H:%i') AS hour FROM route_hours WHERE idRoute = ?`,
        [idRoute]
    );
    return rows.map((r) => formatHour(r.hour));
}

function groupPrices(rows, idField) {
    const byId = {};
    for (const row of rows) {
        const id = row[idField];
        if (!byId[id]) byId[id] = [];
        byId[id].push({
            passengers: Number(row.passengers),
            price: Number(row.price)
        });
    }
    return byId;
}

async function attachExperienceBooking(conn, experiences) {
    if (!experiences || experiences.length === 0) return experiences;
    const ids = experiences.map((e) => e.idExperience);
    const prices = await getExperiencePrices(conn, ids);
    const byId = groupPrices(prices, 'idExperience');
    for (const item of experiences) {
        item.prices = byId[item.idExperience] || [];
        normalizeProduct(item);
    }
    return experiences;
}

async function attachRouteBooking(conn, routes) {
    if (!routes || routes.length === 0) return routes;
    const ids = routes.map((r) => r.idRoute);
    const prices = await getRoutePrices(conn, ids);
    const byId = groupPrices(prices, 'idRoute');
    for (const item of routes) {
        item.prices = byId[item.idRoute] || [];
        normalizeProduct(item);
    }
    return routes;
}

async function getExperienceConfigByCode(conn, code) {
    const rows = await query(
        conn,
        `SELECT idExperience, code, minDaysAhead, maxDaysAhead, allowedWeekdays
         FROM experiences WHERE code = ? LIMIT 1`,
        [code]
    );
    if (!rows.length) return null;
    const product = rows[0];
    const [prices, hours] = await Promise.all([
        getExperiencePrices(conn, [product.idExperience]),
        getExperienceHours(conn, product.idExperience)
    ]);
    product.prices = prices.map((p) => ({
        passengers: Number(p.passengers),
        price: Number(p.price)
    }));
    product.hours = hours;
    product.kind = 'experience';
    return normalizeProduct(product);
}

async function getRouteConfigByCode(conn, code) {
    const rows = await query(
        conn,
        `SELECT idRoute, code, minDaysAhead, maxDaysAhead, allowedWeekdays
         FROM routes WHERE code = ? LIMIT 1`,
        [code]
    );
    if (!rows.length) return null;
    const product = rows[0];
    const [prices, hours] = await Promise.all([
        getRoutePrices(conn, [product.idRoute]),
        getRouteHours(conn, product.idRoute)
    ]);
    product.prices = prices.map((p) => ({
        passengers: Number(p.passengers),
        price: Number(p.price)
    }));
    product.hours = hours;
    product.kind = 'route';
    return normalizeProduct(product);
}

async function resolveProductConfig(conn, { experienceCode, routeCode }) {
    const exp = (experienceCode || '').toString().trim();
    const route = (routeCode || '').toString().trim();
    if (exp) return getExperienceConfigByCode(conn, exp);
    if (route) return getRouteConfigByCode(conn, route);
    return null;
}

function filterHoursForProduct(occupancyHours, productConfig) {
    const allowed = new Set((productConfig.hours || []).map(formatHour));
    return (occupancyHours || []).filter((item) => allowed.has(formatHour(item.hour)));
}

module.exports = {
    getExperiencePrices,
    getRoutePrices,
    getExperienceHours,
    getRouteHours,
    attachExperienceBooking,
    attachRouteBooking,
    getExperienceConfigByCode,
    getRouteConfigByCode,
    resolveProductConfig,
    filterHoursForProduct
};
