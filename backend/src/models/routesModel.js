async function getRoutes(conn, includeDeleted) {
    return new Promise((resolve, reject) => {
        let query = ` SELECT idRoute, value2, value3, code, title, description, durationMinutes, duration, image, mapImage, visibleToClients, minDaysAhead, maxDaysAhead, allowedWeekdays, deleted FROM routes WHERE deleted = 0 OR ? = 1 `
        let params = [includeDeleted]

        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

    })
}


async function createRoute(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO routes (code, title, description, value2, value3, image, durationMinutes, duration, mapImage, visibleToClients, minDaysAhead, maxDaysAhead, allowedWeekdays)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const qParams = [p.code, p.title, p.description, p.value2, p.value3, p.image, p.durationMinutes, p.duration, p.mapImage, p.visibleToClients, p.minDaysAhead, p.maxDaysAhead, p.allowedWeekdays];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function updateRoute(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE routes
        SET code = ?, title = ?, description = ?, value2 = ?, value3 = ?, image = ?, durationMinutes = ?, duration = ?, mapImage = ?, visibleToClients = ?, minDaysAhead = ?, maxDaysAhead = ?, allowedWeekdays = ?
        WHERE idRoute = ?
        `;
        const qParams = [p.code, p.title, p.description, p.value2, p.value3, p.image, p.durationMinutes, p.duration, p.mapImage, p.visibleToClients, p.minDaysAhead, p.maxDaysAhead, p.allowedWeekdays, p.idRoute];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function deleteRoute(conn, idRoute) {
    return new Promise((resolve, reject) => {
        conn.query('UPDATE routes SET deleted = 1 WHERE idRoute = ? AND deleted = 0', [idRoute], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

module.exports = {
    getRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
}