async function getPilots(conn, includeDeleted, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT idPilot, pilotName, pilotPicture, phoneNumber, active, deleted
        FROM pilots
        WHERE idAccount = ? AND (deleted = 0 OR ? = 1)
        `;
        conn.query(query, [idAccount, includeDeleted], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getPilotById(conn, idPilot, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT idPilot, pilotName, pilotPicture, phoneNumber, active
        FROM pilots
        WHERE idPilot = ? AND idAccount = ?
        `;
        conn.query(query, [idPilot, idAccount], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function createPilot(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO pilots (pilotName, pilotPicture, phoneNumber, active, idAccount)
        VALUES (?, ?, ?, ?, ?)
        `;
        const qParams = [p.pilotName, p.pilotPicture, p.phoneNumber, p.active, p.idAccount];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function updatePilot(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE pilots
        SET pilotName = ?, pilotPicture = ?, phoneNumber = ?, active = ?
        WHERE idPilot = ? AND idAccount = ?
        `;
        const qParams = [p.pilotName, p.pilotPicture, p.phoneNumber, p.active, p.idPilot, p.idAccount];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function deletePilot(conn, idPilot, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE pilots SET deleted = 1
        WHERE idPilot = ? AND idAccount = ? AND deleted = 0
        `;
        const qParams = [idPilot, idAccount];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

module.exports = {
    getPilots,
    getPilotById,
    createPilot,
    updatePilot,
    deletePilot
}
