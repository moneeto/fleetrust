async function createReservation(conn, params) {
    // params: { reservationDate, reservationTime, idTourType, 
    // passengers, idStatus, totalValue, deposit, remainingBalance }
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO reservations (
            startDate, 
            endDate, 
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
            SELECT 
                a.hour,
                COUNT(r.idReservation) AS reservationsCount
            FROM availableHours a
            LEFT JOIN reservations r
                ON TIMESTAMP(?, a.hour) >= r.startDate
            AND TIMESTAMP(?, a.hour) <  r.endDate
            GROUP BY a.hour
            HAVING reservationsCount < (
                SELECT COUNT(1)
                FROM aircrafts
                WHERE available = 1
            )
            ORDER BY a.hour ASC;

        `;
        const qParams = [date, date];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getReservationsByDate(conn, date) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*, b.title AS route, c.title AS experience
        from reservations a
        LEFT JOIN routes b on a.idRoute = b.idRoute
        LEFT JOIN experiences c on a.idExperience = c.idExperience
        WHERE DATE(a.startDate) <= ?
        AND DATE(a.endDate) >= ?
        AND a.idStatus = 3;
        `;
        const qParams = [date, date];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getReservationById(conn, id) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*, b.title AS route, d.title AS experience, c.aircraft, c.registrationNumber
        from reservations a
        LEFT JOIN routes b on a.idRoute = b.idRoute
        LEFT JOIN aircrafts c on a.idAircraft = c.idAircraft
        LEFT JOIN experiences d ON d.idExperience=a.idExperience
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

async function getPassengersByReservationId(conn, idReservation) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT *
            FROM passengers
            WHERE idReservation = ?

        `;
        let params = [idReservation];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    })
}

async function updateReservation(conn, params) {
    return new Promise((resolve, reject) => {
        let query = `
        UPDATE reservations SET 
            name = ?, 
            lastname = ?, 
            email = ?, 
            phoneNumber = ?, 
            notes = ?, 
            startDate = ?, 
            endDate = ?, 
            idRoute = ?, 
            idExperience = ?, 
            idAircraft = ?
        WHERE idReservation = ?
        `;

        let queryParams = [
            params.name,
            params.lastname,
            params.email,
            params.phoneNumber,
            params.notes,
            params.startDate,
            params.endDate,
            params.idRoute,
            params.idExperience,
            params.idAircraft,
            params.idReservation
        ];
        conn.query(query, queryParams, (err, results) => {
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
    insertPassengers,
    getPassengersByReservationId,
    updateReservation,
}
