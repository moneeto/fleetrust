async function getAircrafts(conn) {
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

module.exports = {
    getAircrafts,
    updateAircraft,
    createAircraft
}