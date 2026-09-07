async function getAddons(conn) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT idAddon, addon, description, price, active
        FROM addons
        ORDER BY addon ASC
        `;
        conn.query(query, [], (err, results) => {
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
        DELETE FROM addons
        WHERE idAddon = ?
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
