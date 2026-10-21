async function getServices(conn, includeDeleted) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM services WHERE deleted = 0 OR ? = 1 ORDER BY title`;
        conn.query(query, [includeDeleted], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServicePrices(conn) {
    return new Promise((resolve, reject) => {
        conn.query('SELECT idService, passengers, price FROM services_prices ORDER BY passengers', (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServiceHours(conn) {
    return new Promise((resolve, reject) => {
        conn.query(`SELECT idService, TIME_FORMAT(hour, '%H:%i') AS hour FROM services_hours ORDER BY hour`, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServiceAddons(conn) {
    return new Promise((resolve, reject) => {
        conn.query('SELECT idService, idAddon FROM services_addons', (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getServiceByCode(conn, code) {
    return new Promise((resolve, reject) => {
        conn.query('SELECT * FROM services WHERE code = ? AND deleted = 0 LIMIT 1', [code], (err, results) => {
            if (err) return reject(err);
            resolve(results[0] || null);
        });
    });
}

async function findServiceIdByCode(conn, code) {
    return new Promise((resolve, reject) => {
        conn.query('SELECT idService FROM services WHERE code = ? LIMIT 1', [code], (err, results) => {
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
            visibleToClients, minDaysAhead, maxDaysAhead, allowedWeekdays
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const qParams = [
            p.code, p.title, p.description, p.image, p.duration, p.durationMinutes,
            p.visibleToClients, p.minDaysAhead, p.maxDaysAhead, p.allowedWeekdays
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
        WHERE idService = ?
        `;
        const qParams = [
            p.title, p.description, p.image, p.duration, p.durationMinutes,
            p.visibleToClients, p.minDaysAhead, p.maxDaysAhead, p.allowedWeekdays, p.idService
        ];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function deleteServicePrices(conn, idService) {
    return new Promise((resolve, reject) => {
        conn.query('DELETE FROM services_prices WHERE idService = ?', [idService], (err, results) => {
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

async function deleteServiceHours(conn, idService) {
    return new Promise((resolve, reject) => {
        conn.query('DELETE FROM services_hours WHERE idService = ?', [idService], (err, results) => {
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

async function deleteServiceAddons(conn, idService) {
    return new Promise((resolve, reject) => {
        conn.query('DELETE FROM services_addons WHERE idService = ?', [idService], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function insertServiceAddon(conn, idService, idAddon) {
    return new Promise((resolve, reject) => {
        conn.query(
            'INSERT INTO services_addons (idService, idAddon) VALUES (?, ?)',
            [idService, idAddon],
            (err, results) => {
                if (err) return reject(err);
                resolve(results);
            }
        );
    });
}

async function deleteService(conn, idService) {
    return new Promise((resolve, reject) => {
        conn.query('UPDATE services SET deleted = 1 WHERE idService = ? AND deleted = 0', [idService], (err, results) => {
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
