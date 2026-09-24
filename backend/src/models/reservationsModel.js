// Returns reservations that overlap with a given date range for a specific aircraft
async function getReservationsInRange(conn, startDate, endDate, idAircraft) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT idReservation, idAircraft, startDate, endDate 
            FROM reservations
            WHERE 1 = 1
            AND idStatus IN (3,2,1)
            AND ((startDate < ? AND endDate > ?))
        `;
        const qParams = [endDate, startDate];
        
        if (idAircraft != 'all') {
            query += ` AND idAircraft = ?`
            qParams.push(idAircraft)
        }
        
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
         idRoute, idExperience, idStatus, totalValue, deposit, remainingBalance, reservationExpiration, idAircraft, idPilot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            params.idAircraft,
            params.idPilot || null
        ];

        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getAvailableHours(conn, p) {
    return new Promise((resolve, reject) => {
        // A slot stays visible only when some aircraft is free for the whole hour.
        // Overlap matches getAircrafts: existing start < slot end AND existing end > slot start.
        const idAircraft = p.idAircraft || null;
        const query = `
            SELECT a.hour
            FROM availableHours a
            WHERE a.active = 1
            AND EXISTS (
                SELECT 1
                FROM aircrafts ac
                WHERE ac.available = 1
                AND (ac.deleted = 0 OR ac.deleted IS NULL)
                AND (? IS NULL OR ac.idAircraft = ?)
                AND NOT EXISTS (
                    SELECT 1
                    FROM reservations r
                    WHERE r.idAircraft = ac.idAircraft
                    AND r.idStatus NOT IN (4, 5)
                    AND r.startDate < DATE_ADD(TIMESTAMP(?, a.hour), INTERVAL 1 HOUR)
                    AND r.endDate > TIMESTAMP(?, a.hour)
                )
            )
            ORDER BY a.hour ASC
        `;
        const qParams = [idAircraft, idAircraft, p.date, p.date];

        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

/**
 * Reservations that overlap [dateFrom, dateFrom] (calendar days) with optional filters.
 * filters: { codeReservation?, client?, idAircraft?, idRoute? }
 */
async function getReservationsByDateRange(conn, dateFrom, dateTo, filters = {}) {
    return new Promise((resolve, reject) => {
        let query = `
        SELECT a.*, b.title AS route, c.title AS experience, d.aircraft, d.registrationNumber
        FROM reservations a
        LEFT JOIN routes b ON a.idRoute = b.idRoute
        LEFT JOIN experiences c ON a.idExperience = c.idExperience
        LEFT JOIN aircrafts d ON a.idAircraft = d.idAircraft
        WHERE DATE(a.endDate) >= ?
        AND DATE(a.startDate) <= ?
        AND a.idStatus = 3
        `;
        const qParams = [dateFrom, dateTo];

        if (filters.codeReservation) {
            const raw = String(filters.codeReservation).replace(/^#/u, '').trim();
            if (raw) {
                query += ` AND CAST(a.codeReservation AS CHAR) LIKE ?`;
                qParams.push(`%${raw}%`);
            }
        }
        if (filters.client) {
            const term = `%${String(filters.client).trim()}%`;
            query += ` AND (
                a.name LIKE ? OR a.lastname LIKE ?
                OR CONCAT(COALESCE(a.name,''), ' ', COALESCE(a.lastname,'')) LIKE ?
            )`;
            qParams.push(term, term, term);
        }
        if (filters.idAircraft && String(filters.idAircraft) !== '' && filters.idAircraft !== 'all') {
            query += ` AND a.idAircraft = ?`;
            qParams.push(filters.idAircraft);
        }
        if (filters.idRoute != null && String(filters.idRoute) !== '' && filters.idRoute !== 'all') {
            query += ` AND a.idRoute = ?`;
            qParams.push(filters.idRoute);
        }
        if (filters.idPilot != null && String(filters.idPilot) !== '' && filters.idPilot !== 'all') {
            query += ` AND a.idPilot = ?`;
            qParams.push(filters.idPilot);
        }

        query += ` ORDER BY a.startDate DESC, a.idReservation DESC`;

        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getReservationsByDate(conn, date) {
    return getReservationsByDateRange(conn, date, date, {});
}

async function getReservationById(conn, id) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*, b.title AS route, d.title AS experience, c.aircraft, c.registrationNumber, e.pilotName
        from reservations a
        LEFT JOIN routes b on a.idRoute = b.idRoute
        LEFT JOIN aircrafts c on a.idAircraft = c.idAircraft
        LEFT JOIN experiences d ON d.idExperience=a.idExperience
        LEFT JOIN pilots e ON a.idPilot = e.idPilot
        WHERE a.idReservation = ?
        `;
        const qParams = [id];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getReservationByConfirmationHash(conn, confirmationHash) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*, b.title AS route, d.title AS experience, c.aircraft, c.registrationNumber
        FROM reservations a
        LEFT JOIN routes b ON a.idRoute = b.idRoute
        LEFT JOIN aircrafts c ON a.idAircraft = c.idAircraft
        LEFT JOIN experiences d ON d.idExperience = a.idExperience
        WHERE a.confirmationHash = ?
        LIMIT 1
        `;
        conn.query(query, [confirmationHash], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function completeQrValidation(conn, idReservation) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE reservations
        SET validatedQR = 1, validatedDatetime = NOW()
        WHERE idReservation = ?
        AND COALESCE(validatedQR, 0) = 0
        AND idStatus = 3
        `;
        conn.query(query, [idReservation], (err, results) => {
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

async function getReservationAddons(conn, idReservation) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.idAddon, a.addon, ra.price, ra.quantity
        FROM reservationsAddons ra
        JOIN addons a ON a.idAddon = ra.idAddon
        WHERE ra.idReservation = ?
        `;
        conn.query(query, [idReservation], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
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
            idAircraft = ?,
            idPilot = ?
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
            params.idPilot,
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
        const query = `SELECT idRoute, value2, value3, minDaysAhead, maxDaysAhead, allowedWeekdays FROM routes WHERE code = ? LIMIT 1`;
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
        SELECT idExperience, code, title, description, value2, value3, image,
            minDaysAhead, maxDaysAhead, allowedWeekdays,
            (SELECT duration FROM routes WHERE code = 'PRE') as duration
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

async function saveConfirmationHash(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE reservations SET confirmationHash = ? WHERE idReservation = ?;
        `;
        conn.query(query, [p.confirmationHash, p.idReservation], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
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

async function getCancellationReasons(conn) {
    return new Promise((resolve, reject) => {
        const query = `SELECT idCancellationReason, cancellationReason FROM cancellationReasons`;
        conn.query(query, [], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function cancelReservation(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE reservations
        SET idStatus = 5, idCancellationReason = ?, cancellationDetail = ?
        WHERE idReservation = ?
        `;
        const params = [p.idCancellationReason, p.cancellationDetail, p.idReservation];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
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
            AND (a.deleted = 0 OR a.deleted IS NULL)
            AND NOT EXISTS (
                SELECT 1
                FROM reservations r
                WHERE r.idAircraft = a.idAircraft
                AND r.startDate < ?
                AND r.endDate > ?
                AND r.idStatus NOT IN (4, 5)
            );

        `;
        let params = [endDate, startDate];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    })
}

// Delete reservation addons
async function deleteReservationAddons(conn, idReservation) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM reservationsAddons WHERE idReservation = ?`;
        const params = [idReservation];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// Delete reservation passengers
async function deleteReservationPassengers(conn, idReservation) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM passengers WHERE idReservation = ?`;
        const params = [idReservation];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// Delete reservation
async function deleteReservation(conn, idReservation) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM reservations WHERE idReservation = ?`;
        const params = [idReservation];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

module.exports = {
    getReservationsByDate,
    getReservationsByDateRange,
    createReservation,
    getAvailableHours,
    getReservationById,
    getReservationByConfirmationHash,
    completeQrValidation,
    updateReservationHolder,
    insertPassengers,
    getPassengersByReservationId,
    getReservationAddons,
    updateReservation,
    getRouteByCode,
    getExperienceByCode,
    getPremiumRouteValue,
    getReservationsInRange,
    updateReservationStatus,
    getCancellationReasons,
    cancelReservation,
    getAircrafts,
    updateReservationNotes,
    checkReservationOverlap,
    deleteReservationAddons,
    deleteReservationPassengers,
    deleteReservation,
    saveConfirmationHash
}
