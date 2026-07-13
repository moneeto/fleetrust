async function getAircrafts(conn, includeDeleted = false) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*,
            EXISTS (
                SELECT 1
                FROM reservations r
                WHERE r.idAircraft = a.idAircraft
                  AND r.idStatus IN (1, 2, 3)
                  AND DATE(r.endDate) >= CURDATE()
            ) AS plannedBookings
        FROM aircrafts a
        ${includeDeleted ? '' : 'WHERE (a.deleted = 0 OR a.deleted IS NULL)'}
        `;
        const qParams = [];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}
async function updateAircraft(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE aircrafts
        SET aircraft = ?, capacity = ?, registrationNumber = ?, available = ?
        WHERE idAircraft = ?
        `;
        const qParams = [p.aircraft, p.capacity, p.registrationNumber, p.available, p.idAircraft];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}
async function createAircraft(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO aircrafts (aircraft, capacity, registrationNumber, available)
        VALUES (?, ?, ?, ?)

        `;
        const qParams = [p.aircraft, p.capacity, p.registrationNumber, p.available];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function deleteAircraft(conn, idAircraft) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE aircrafts
        SET deleted = 1
        WHERE idAircraft = ? AND (deleted = 0 OR deleted IS NULL)
        `;
        const qParams = [idAircraft];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function restoreAircraft(conn, idAircraft) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE aircrafts
        SET deleted = 0
        WHERE idAircraft = ? AND deleted = 1
        `;
        const qParams = [idAircraft];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

module.exports = {
    getAircrafts,
    updateAircraft,
    createAircraft,
    deleteAircraft,
    restoreAircraft
}