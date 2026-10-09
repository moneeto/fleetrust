async function getAddons(conn, includeDeleted) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT idAddon, addon, description, price, active, deleted
        FROM addons
        WHERE deleted = 0 OR ? = 1
        ORDER BY addon ASC
        `;
        conn.query(query, [includeDeleted], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function createAddon(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO addons (addon, description, price, active)
        VALUES (?, ?, ?, ?)
        `;
        const qParams = [p.addon, p.description, p.price, p.active];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function updateAddon(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE addons
        SET addon = ?, description = ?, price = ?, active = ?
        WHERE idAddon = ?
        `;
        const qParams = [p.addon, p.description, p.price, p.active, p.idAddon];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function deleteAddon(conn, idAddon) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE addons
        SET deleted = 1
        WHERE idAddon = ? AND deleted = 0
        `;
        const qParams = [idAddon];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

module.exports = {
    getAddons,
    createAddon,
    updateAddon,
    deleteAddon
}
