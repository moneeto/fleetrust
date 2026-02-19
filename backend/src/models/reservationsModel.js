async function createReservation(conn, params) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO reservations (passengers, startDate, endDate,
         idRoute, idExperience, idStatus, totalValue, deposit, remainingBalance, reservationExpiration, idAircraft, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const qParams = [
            params.passengers,
            params.startDate,
            params.endDate,
            params.idRoute,
            params.idExperience,
            params.idStatus,
            params.totalValue,
            params.deposit,
            params.remainingBalance,
            params.reservationExpiration,
            params.idAircraft,
            params.notes
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

async function getRouteByCode(conn, code) {
    return new Promise((resolve, reject) => {
        const query = `SELECT idRoute, value2, value3 FROM routes WHERE code = ? LIMIT 1`;
        const params = [code];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            if (!results || results.length === 0) return resolve(null);
            resolve(results[0]);
        });
    });
}

async function getExperienceByCode(conn, code) {
    return new Promise((resolve, reject) => {
        let query = `
        SELECT code, title, description, value, (SELECT duration FROM routes WHERE code = 'PRE') as duration
        FROM experiences 
        WHERE code = ?
        `
        let params = [code]
        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

    })
}

async function getPremiumRouteValue(conn) {
    return new Promise((resolve, reject) => {
        let query = `
        SELECT value2 FROM routes WHERE code = 'PRE'
        `
        let params = []
        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

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
    getRouteByCode,
    getExperienceByCode,
    getPremiumRouteValue
}
