// Returns reservations that overlap with a given date range for a specific aircraft
async function getReservationsInRange(conn, startDate, endDate, idAircraft, idAccount) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT idReservation, idAircraft, startDate, endDate 
            FROM reservations
            WHERE idAccount = ?
            AND idStatus IN (3,2,1)
            AND ((startDate < ? AND endDate > ?))
        `;
        const qParams = [idAccount, endDate, startDate];
        
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
         idRoute, idExperience, idService, idStatus, totalValue, deposit, remainingBalance, reservationExpiration, idAircraft, idPilot, idAccount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const qParams = [
            params.passengerCount,
            params.startDate,
            params.endDate,
            params.idRoute,
            params.idExperience,
            params.idService || null,
            params.idStatus,
            params.totalValue,
            params.deposit,
            params.remainingBalance,
            params.reservationExpiration,
            params.idAircraft,
            params.idPilot || null,
            params.idAccount
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
            FROM available_hours a
            WHERE a.active = 1
            AND EXISTS (
                SELECT 1
                FROM aircrafts ac
                WHERE ac.available = 1
                AND ac.idAccount = ?
                AND (ac.deleted = 0 OR ac.deleted IS NULL)
                AND (? IS NULL OR ac.idAircraft = ?)
                AND NOT EXISTS (
                    SELECT 1
                    FROM reservations r
                    WHERE r.idAircraft = ac.idAircraft
                    AND r.idAccount = ?
                    AND r.idStatus NOT IN (4, 5)
                    AND r.startDate < DATE_ADD(TIMESTAMP(?, a.hour), INTERVAL 1 HOUR)
                    AND r.endDate > TIMESTAMP(?, a.hour)
                )
            )
            ORDER BY a.hour ASC
        `;
        const qParams = [p.idAccount, idAircraft, idAircraft, p.idAccount, p.date, p.date];

        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

/**
 * Reservations that overlap [dateFrom, dateFrom] (calendar days) with optional filters.
 * filters: { codeReservation?, client?, idAircraft?, idRoute?, statusIds? }
 * Missing statusIds keeps confirmed only (idStatus 3). [] returns no rows.
 */
async function getReservationsByDateRange(conn, dateFrom, dateTo, filters = {}) {
    return new Promise((resolve, reject) => {
        let query = `
        SELECT a.*, b.title AS route, s.title AS experience, s.title AS service, COALESCE(s.code, b.code) AS serviceCode, d.aircraft, d.registrationNumber
        FROM reservations a
        LEFT JOIN routes b ON a.idRoute = b.idRoute
        LEFT JOIN services s ON a.idService = s.idService
        LEFT JOIN aircrafts d ON a.idAircraft = d.idAircraft
        WHERE a.idAccount = ?
        AND DATE(a.endDate) >= ?
        AND DATE(a.startDate) <= ?
        `;
        const qParams = [filters.idAccount, dateFrom, dateTo];

        if (Array.isArray(filters.statusIds)) {
            if (filters.statusIds.length) {
                query += ` AND a.idStatus IN (?)`;
                qParams.push(filters.statusIds);
            } else {
                query += ` AND 1 = 0`;
            }
        } else {
            query += ` AND a.idStatus = 3`;
        }

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
        if (filters.idService != null && String(filters.idService) !== '' && filters.idService !== 'all') {
            query += ` AND a.idService = ?`;
            qParams.push(filters.idService);
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

async function getReservationsByDate(conn, date, idAccount) {
    return getReservationsByDateRange(conn, date, date, { idAccount });
}

async function getReservationById(conn, id, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*, b.title AS route, s.title AS experience, s.title AS service, s.code AS serviceCode, c.aircraft, c.registrationNumber, e.pilotName
        from reservations a
        LEFT JOIN routes b on a.idRoute = b.idRoute
        LEFT JOIN aircrafts c on a.idAircraft = c.idAircraft
        LEFT JOIN services s ON a.idService = s.idService
        LEFT JOIN pilots e ON a.idPilot = e.idPilot
        WHERE a.idReservation = ? AND a.idAccount = ?
        `;
        const qParams = [id, idAccount];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getReservationByConfirmationHash(conn, confirmationHash, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.*, b.title AS route, s.title AS experience, s.title AS service, c.aircraft, c.registrationNumber
        FROM reservations a
        LEFT JOIN routes b ON a.idRoute = b.idRoute
        LEFT JOIN aircrafts c ON a.idAircraft = c.idAircraft
        LEFT JOIN services s ON a.idService = s.idService
        WHERE a.confirmationHash = ? AND a.idAccount = ?
        LIMIT 1
        `;
        conn.query(query, [confirmationHash, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function completeQrValidation(conn, idReservation, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE reservations
        SET validatedQR = 1, validatedDatetime = NOW()
        WHERE idReservation = ?
        AND idAccount = ?
        AND COALESCE(validatedQR, 0) = 0
        AND idStatus = 3
        `;
        conn.query(query, [idReservation, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function updateReservationHolder(conn, p) {
    return new Promise((resolve, reject) => {
        let query = `
        UPDATE reservations SET name = ?, lastname = ?, email=?, phoneNumber=? WHERE idReservation = ? AND idAccount = ?
        `;

        let params = [p.firstName, p.lastName, p.email, p.phone, p.idReservation, p.idAccount];
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

async function getPassengersByReservationId(conn, idReservation, idAccount) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT p.*
            FROM passengers p
            INNER JOIN reservations r ON r.idReservation = p.idReservation
            WHERE p.idReservation = ? AND r.idAccount = ?

        `;
        let params = [idReservation, idAccount];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    })
}

async function getReservationAddons(conn, idReservation, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.idAddon, a.addon, ra.price, ra.quantity
        FROM reservations_addons ra
        JOIN addons a ON a.idAddon = ra.idAddon
        JOIN reservations r ON r.idReservation = ra.idReservation
        WHERE ra.idReservation = ? AND r.idAccount = ?
        `;
        conn.query(query, [idReservation, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServiceAddons(conn, idService, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT a.idAddon, a.addon, 0 AS price, 1 AS quantity
        FROM services_addons ea
        JOIN addons a ON a.idAddon = ea.idAddon
        JOIN services s ON s.idService = ea.idService
        WHERE ea.idService = ? AND s.idAccount = ? AND a.idAccount = ?
        `;
        conn.query(query, [idService, idAccount, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function insertReservationAddon(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO reservations_addons (idReservation, idAddon, quantity, price) VALUES (?, ?, ?, ?)
        `;
        conn.query(query, [p.idReservation, p.idAddon, p.quantity, p.price], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function reservationAddonsWithIncluded(conn, idReservation, idService, idAccount) {
    const addons = await getReservationAddons(conn, idReservation, idAccount);
    if (!idService) return addons;

    const included = await getServiceAddons(conn, idService, idAccount);
    const present = new Set(addons.map((item) => Number(item.idAddon)));
    for (const item of included) {
        if (!present.has(Number(item.idAddon))) addons.push(item);
    }
    return addons;
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
        WHERE idReservation = ? AND idAccount = ?
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
            params.idReservation,
            params.idAccount
        ];
        conn.query(query, queryParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    })
}

async function getRouteByCode(conn, code) {
    return new Promise((resolve, reject) => {
        const query = `SELECT idRoute, value2, value3, minDaysAhead, maxDaysAhead, allowedWeekdays FROM routes WHERE code = ? AND deleted = 0 LIMIT 1`;
        const params = [code];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            if (!results || results.length === 0) return resolve(null);
            resolve(results[0]);
        });
    });
}

async function saveConfirmationHash(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE reservations SET confirmationHash = ? WHERE idReservation = ? AND idAccount = ?;
        `;
        conn.query(query, [p.confirmationHash, p.idReservation, p.idAccount], (err, results) => {
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
        UPDATE reservations SET idStatus = ? where idReservation = ? AND idAccount = ?
        `
        let params = [p.idStatus, p.idReservation, p.idAccount]
        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

    })
}

async function getStatuses(conn) {
    return new Promise((resolve, reject) => {
        const query = `SELECT idStatus, status FROM \`status\` ORDER BY idStatus`;
        conn.query(query, [], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getCancellationReasons(conn) {
    return new Promise((resolve, reject) => {
        const query = `SELECT idCancellationReason, cancellationReason FROM cancellation_reasons`;
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
        WHERE idReservation = ? AND idAccount = ?
        `;
        const params = [p.idCancellationReason, p.cancellationDetail, p.idReservation, p.idAccount];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function updateReservationNotes(conn, p) {
    return new Promise((resolve, reject) => {
        let query = `
        UPDATE reservations SET notes = ? where idReservation = ? AND idAccount = ?
        `
        let params = [p.notes, p.idReservation, p.idAccount]
        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

    })
}

// Check for overlapping reservations excluding the current reservation
async function checkReservationOverlap(conn, startDate, endDate, idAircraft, excludeIdReservation, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM reservations
            WHERE idAccount = ?
            AND idAircraft = ?
            AND idStatus IN (3, 2, 1)
            AND ((startDate < ? AND endDate > ?))
            AND idReservation != ?
        `;
        const qParams = [idAccount, idAircraft, endDate, startDate, excludeIdReservation];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function checkPilotOverlap(conn, startDate, endDate, idPilot, excludeIdReservation, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM reservations
            WHERE idAccount = ?
            AND idPilot = ?
            AND idStatus IN (3, 2, 1)
            AND ((startDate < ? AND endDate > ?))
            AND idReservation != ?
        `;
        const qParams = [idAccount, idPilot, endDate, startDate, excludeIdReservation];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getAircrafts(conn, startDate, endDate, idAccount) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT a.*
            FROM aircrafts a
            WHERE a.idAccount = ?
            AND a.available = 1
            AND (a.deleted = 0 OR a.deleted IS NULL)
            AND NOT EXISTS (
                SELECT 1
                FROM reservations r
                WHERE r.idAircraft = a.idAircraft
                AND r.idAccount = ?
                AND r.startDate < ?
                AND r.endDate > ?
                AND r.idStatus NOT IN (4, 5)
            );

        `;
        let params = [idAccount, idAccount, endDate, startDate];
        conn.query(query, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    })
}

// Delete reservation addons
async function deleteReservationAddons(conn, idReservation) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM reservations_addons WHERE idReservation = ?`;
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
async function deleteReservation(conn, idReservation, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM reservations WHERE idReservation = ? AND idAccount = ?`;
        const params = [idReservation, idAccount];
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
    getServiceAddons,
    insertReservationAddon,
    reservationAddonsWithIncluded,
    updateReservation,
    getRouteByCode,
    getPremiumRouteValue,
    getReservationsInRange,
    updateReservationStatus,
    getStatuses,
    getCancellationReasons,
    cancelReservation,
    getAircrafts,
    updateReservationNotes,
    checkReservationOverlap,
    checkPilotOverlap,
    deleteReservationAddons,
    deleteReservationPassengers,
    deleteReservation,
    saveConfirmationHash
}
