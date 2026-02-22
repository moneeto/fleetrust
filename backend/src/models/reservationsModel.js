// Returns reservations that overlap with a given date range for a specific aircraft
async function getReservationsInRange(conn, startDate, endDate, idAircraft) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM reservations
            WHERE idAircraft = ?
            AND idStatus IN (3,2,1)
            AND ((startDate < ? AND endDate > ?))
        `;
        const qParams = [idAircraft, endDate, startDate];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}
async function createReservation(conn, params) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO reservations (passengers, startDate, endDate,
         idRoute, idExperience, idStatus, totalValue, deposit, remainingBalance, reservationExpiration, idAircraft)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const qParams = [
            params.passengerCount,
            params.startDate,
            params.endDate,
            params.idRoute,
            params.idExperience,
            params.idStatus,
            params.totalValue,
            params.deposit,
            params.remainingBalance,
            params.reservationExpiration,
            params.idAircraft
        ];

        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getAvailableHours(conn, p) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT 
                a.hour,
                COUNT(r.idReservation) AS reservationsCount
            FROM availableHours a
            LEFT JOIN reservations r
                ON TIMESTAMP(?, a.hour) >= r.startDate
            AND TIMESTAMP(?, a.hour) <  r.endDate

        `;
        let qParams = [p.date, p.date]

        if(p.idAircraft) {
            query += ` AND r.idAircraft = ?`
            qParams.push(p.idAircraft, p.idAircraft)
        }

        query+= `
        GROUP BY a.hour
            HAVING reservationsCount < (
                SELECT COUNT(1)
                FROM aircrafts
                WHERE available = 1
                ${p.idAircraft ? 'AND idAircraft = ?' : ''}
            )
        ORDER BY a.hour ASC
        `

        console.log(query);
        console.log(qParams);
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

async function updateReservationStatus(conn, p) {
    return new Promise((resolve, reject) => {
        let query = `
        UPDATE reservations SET idStatus = ? where idReservation = ?
        `
        let params = [p.idStatus, p.idReservation]
        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

    })
}

async function updateReservationNotes(conn, p) {
    return new Promise((resolve, reject) => {
        let query = `
        UPDATE reservations SET notes = ? where idReservation = ?
        `
        let params = [p.notes, p.idReservation]
        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

    })
}

// Check for overlapping reservations excluding the current reservation
async function checkReservationOverlap(conn, startDate, endDate, idAircraft, excludeIdReservation) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM reservations
            WHERE idAircraft = ?
            AND idStatus IN (3, 2, 1)
            AND ((startDate < ? AND endDate > ?))
            AND idReservation != ?
        `;
        const qParams = [idAircraft, endDate, startDate, excludeIdReservation];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getAircrafts(conn, startDate, endDate) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT a.*
            FROM aircrafts a
            WHERE a.available = 1
            AND NOT EXISTS (
                SELECT 1
                FROM reservations r
                WHERE r.idAircraft = a.idAircraft
                AND r.startDate < ?
                AND r.endDate > ?
                AND r.idStatus <> 4
            );

        `;
        let params = [endDate, startDate];
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
    insertPassengers,
    getPassengersByReservationId,
    updateReservation,
    getRouteByCode,
    getExperienceByCode,
    getPremiumRouteValue,
    getReservationsInRange,
    updateReservationStatus,
    getAircrafts,
    updateReservationNotes,
    checkReservationOverlap
}
