async function getAddons(conn, includeDeleted, idAccount) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT idAddon, addon, description, price, active, deleted
        FROM addons
        WHERE idAccount = ? AND (deleted = 0 OR ? = 1)
        ORDER BY addon ASC
        `;
        conn.query(query, [idAccount, includeDeleted], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function createAddon(conn, p) {
    return new Promise((resolve, reject) => {
        const query = `
        INSERT INTO addons (addon, description, price, active, idAccount, createdBy, updatedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const qParams = [p.addon, p.description, p.price, p.active, p.idAccount, p.idUser, p.idUser];
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
        SET addon = ?, description = ?, price = ?, active = ?, updatedBy = ?
        WHERE idAddon = ? AND idAccount = ?
        `;
        const qParams = [p.addon, p.description, p.price, p.active, p.idUser, p.idAddon, p.idAccount];
        conn.query(query, qParams, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function deleteAddon(conn, idAddon, idAccount, idUser) {
    return new Promise((resolve, reject) => {
        const query = `
        UPDATE addons
        SET deleted = 1, updatedBy = ?
        WHERE idAddon = ? AND idAccount = ? AND deleted = 0
        `;
        const qParams = [idUser, idAddon, idAccount];
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
