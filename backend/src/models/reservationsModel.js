async function createReservation(conn, params) {
    // params: { reservationDate, reservationTime, idTourType, 
    // passengers, idStatus, totalValue, deposit, remainingBalance }
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO reservations (
            reservationDate, 
            reservationTime, 
            name,
            lastname,
            idStatus,
            idTourType,
            notes,
            acceptedTerms,
            acceptedTermsTimestamp,
            passengers
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)
        `;
        const qParams = [
            params.reservationDate,
            params.reservationTime,
            params.name,
            params.lastname,
            params.idStatus,
            5,
            params.notes,
            params.passengers
        ];

        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getAvailableHours(conn, date) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.hour, SUM(CASE WHEN r.idReservation IS NULL THEN 0 ELSE 1 END) AS reservationsCount
        FROM availableHours a
        LEFT JOIN reservations r ON r.reservationDate = ? AND a.hour = r.reservationTime
        GROUP BY a.hour
        HAVING reservationsCount < (SELECT COUNT(1) FROM aircrafts WHERE available = 1)
        ORDER BY a.hour ASC
        `;
        const qParams = [date];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getReservationsByDate(conn, date) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*, b.title
        from reservations a
        left join tourTypes b on a.idTourType = b.idTourType
        WHERE a.reservationDate = ?
        AND a.idStatus = 3;
        `;
        const qParams = [date];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getReservationById(conn, id) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*, b.title
        from reservations a
        left join tourTypes b on a.idTourType = b.idTourType
        WHERE a.idReservation = ?
        `;
        const qParams = [id];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function updateReservationHolder(conn, p) {
    return new Promise((resolve, reject) => {
        let query = `
        UPDATE reservations SET name = ?, lastname = ?, email=?, phoneNumber=? WHERE idReservation = ?
        `;

        let params = [p.firstName, p.lastName, p.email, p.phone, p.idReservation];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    })
}
async function insertPassengers(conn, p) {
    return new Promise((resolve, reject) => {
        let query = `
        INSERT INTO passengers (name, lastName, idReservation) VALUES ?
        `;
        let params = [p.passengers];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    })
}


module.exports = {
    getReservationsByDate,
    createReservation,
    getAvailableHours,
    getReservationById,
    updateReservationHolder,
    insertPassengers
}
