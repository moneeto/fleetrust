async function getHours(conn) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT hour, active
        FROM availableHours
        ORDER BY hour ASC
        `;
        conn.query(query, [], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function updateHourActive(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE availableHours
        SET active = ?
        WHERE hour = ?
        `;
        const qParams = [p.active, p.hour];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

module.exports = {
    getHours,
    updateHourActive
}
