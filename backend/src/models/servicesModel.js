async function getServices(conn, includeDeleted, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM services WHERE idAccount = ? AND (deleted = 0 OR ? = 1) ORDER BY title`;
        conn.query(query, [idAccount, includeDeleted], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServicePrices(conn, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `SELECT p.idService, p.passengers, p.price
            FROM services_prices p
            INNER JOIN services s ON s.idService = p.idService
            WHERE s.idAccount = ?
            ORDER BY p.passengers`;
        conn.query(query, [idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServiceHours(conn, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `SELECT h.idService, TIME_FORMAT(h.hour, '%H:%i') AS hour
            FROM services_hours h
            INNER JOIN services s ON s.idService = h.idService
            WHERE s.idAccount = ?
            ORDER BY h.hour`;
        conn.query(query, [idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServiceAddons(conn, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `SELECT sa.idService, sa.idAddon
            FROM services_addons sa
            INNER JOIN services s ON s.idService = sa.idService
            WHERE s.idAccount = ?`;
        conn.query(query, [idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServiceByCode(conn, code, idAccount) {
    return new Promise((resolve, reject) => {
        conn.query('SELECT * FROM services WHERE code = ? AND idAccount = ? AND deleted = 0 LIMIT 1', [code, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results[0] || null);
        });
    });
}

async function findServiceIdByCode(conn, code, idAccount) {
    return new Promise((resolve, reject) => {
        conn.query('SELECT idService FROM services WHERE code = ? AND idAccount = ? LIMIT 1', [code, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results[0] || null);
        });
    });
}

async function createService(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO services (
            code, title, description, image, duration, durationMinutes,
            visibleToClients, minDaysAhead, maxDaysAhead, allowedWeekdays, idAccount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const qParams = [
            p.code, p.title, p.description, p.image, p.duration, p.durationMinutes,
            p.visibleToClients, p.minDaysAhead, p.maxDaysAhead, p.allowedWeekdays, p.idAccount
        ];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function updateService(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE services
        SET title = ?, description = ?, image = ?, duration = ?, durationMinutes = ?,
            visibleToClients = ?, minDaysAhead = ?, maxDaysAhead = ?, allowedWeekdays = ?
        WHERE idService = ? AND idAccount = ?
        `;
        const qParams = [
            p.title, p.description, p.image, p.duration, p.durationMinutes,
            p.visibleToClients, p.minDaysAhead, p.maxDaysAhead, p.allowedWeekdays, p.idService, p.idAccount
        ];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function deleteServicePrices(conn, idService, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `DELETE p FROM services_prices p
            INNER JOIN services s ON s.idService = p.idService
            WHERE p.idService = ? AND s.idAccount = ?`;
        conn.query(query, [idService, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function insertServicePrice(conn, idService, passengers, price) {
    return new Promise((resolve, reject) => {
        conn.query(
            'INSERT INTO services_prices (idService, passengers, price) VALUES (?, ?, ?)',
            [idService, passengers, price],
            (err, results) => {
                if (err) return reject(err);
                resolve(results);
            }
        );
    });
}

async function deleteServiceHours(conn, idService, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `DELETE h FROM services_hours h
            INNER JOIN services s ON s.idService = h.idService
            WHERE h.idService = ? AND s.idAccount = ?`;
        conn.query(query, [idService, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function insertServiceHour(conn, idService, hour) {
    return new Promise((resolve, reject) => {
        conn.query(
            'INSERT INTO services_hours (idService, hour) VALUES (?, ?)',
            [idService, hour],
            (err, results) => {
                if (err) return reject(err);
                resolve(results);
            }
        );
    });
}

async function deleteServiceAddons(conn, idService, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `DELETE sa FROM services_addons sa
            INNER JOIN services s ON s.idService = sa.idService
            WHERE sa.idService = ? AND s.idAccount = ?`;
        conn.query(query, [idService, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function insertServiceAddon(conn, idService, idAddon, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO services_addons (idService, idAddon)
            SELECT ?, ?
            WHERE EXISTS (SELECT 1 FROM services WHERE idService = ? AND idAccount = ?)
            AND EXISTS (SELECT 1 FROM addons WHERE idAddon = ? AND idAccount = ?)`;
        conn.query(query, [idService, idAddon, idService, idAccount, idAddon, idAccount], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            }
        );
    });
}

async function deleteService(conn, idService, idAccount) {
    return new Promise((resolve, reject) => {
        conn.query('UPDATE services SET deleted = 1 WHERE idService = ? AND idAccount = ? AND deleted = 0', [idService, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

module.exports = {
    getServices,
    getServicePrices,
    getServiceHours,
    getServiceAddons,
    getServiceByCode,
    findServiceIdByCode,
    createService,
    updateService,
    deleteServicePrices,
    insertServicePrice,
    deleteServiceHours,
    insertServiceHour,
    deleteServiceAddons,
    insertServiceAddon,
    deleteService
};
