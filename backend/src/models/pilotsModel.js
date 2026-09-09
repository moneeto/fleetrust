async function getPilots(conn) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT idPilot, pilotName, pilotPicture, phoneNumber, active
        FROM pilots
        `;
        conn.query(query, [], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getPilotById(conn, idPilot) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT idPilot, pilotName, pilotPicture, phoneNumber, active
        FROM pilots
        WHERE idPilot = ?
        `;
        conn.query(query, [idPilot], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function createPilot(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO pilots (pilotName, pilotPicture, phoneNumber, active)
        VALUES (?, ?, ?, ?)
        `;
        const qParams = [p.pilotName, p.pilotPicture, p.phoneNumber, p.active];
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
        WHERE idPilot = ?
        `;
        const qParams = [p.pilotName, p.pilotPicture, p.phoneNumber, p.active, p.idPilot];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function deletePilot(conn, idPilot) {
    return new Promise((resolve, reject) => {
        const query = `
        DELETE FROM pilots
        WHERE idPilot = ?
        `;
        const qParams = [idPilot];
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
