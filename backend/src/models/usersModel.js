function query(conn, sql, params) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getUsers(conn, idAccount) {
    const sql = `SELECT u.idUser, u.name, u.surname, u.email, u.active, u.idRole, r.role, r.code
                FROM users u
                LEFT JOIN roles r ON r.idRole = u.idRole
                WHERE u.idAccount = ?
                ORDER BY u.name, u.surname, u.email`;
    return query(conn, sql, [idAccount]);
}

async function getRoles(conn) {
    return query(conn, `SELECT idRole, role, code FROM roles ORDER BY role`, []);
}

async function getUser(conn, idUser, idAccount) {
    const sql = `SELECT u.idUser, u.password, u.active, u.idRole, r.code
                FROM users u
                LEFT JOIN roles r ON r.idRole = u.idRole
                WHERE u.idUser = ? AND u.idAccount = ?`;
    const rows = await query(conn, sql, [idUser, idAccount]);
    return rows[0] || null;
}

async function getRole(conn, idRole) {
    const rows = await query(conn, `SELECT idRole, code FROM roles WHERE idRole = ?`, [idRole]);
    return rows[0] || null;
}

async function findEmail(conn, email) {
    const rows = await query(conn, `SELECT idUser FROM users WHERE email = ?`, [email]);
    return rows[0] || null;
}

async function countOtherAdmins(conn, idAccount, idUser) {
    const sql = `SELECT COUNT(*) AS total
                FROM users u
                INNER JOIN roles r ON r.idRole = u.idRole
                WHERE u.idAccount = ? AND u.active = 1 AND r.code = 'ADM' AND u.idUser <> ?`;
    const rows = await query(conn, sql, [idAccount, idUser]);
    return rows[0].total;
}

async function createUser(conn, p) {
    const sql = `INSERT INTO users (username, email, password, name, surname, idRole, idAccount, active, resetPassword, askBiometric, createdBy, updatedBy)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`;
    return query(conn, sql, [p.email, p.email, p.password, p.name, p.surname, p.idRole, p.idAccount, p.active, p.idUser, p.idUser]);
}

async function updateUser(conn, p) {
    const sql = `UPDATE users
                SET username = ?, email = ?, password = ?, name = ?, surname = ?, idRole = ?, active = ?, updatedBy = ?
                WHERE idUser = ? AND idAccount = ?`;
    return query(conn, sql, [p.email, p.email, p.password, p.name, p.surname, p.idRole, p.active, p.updatedBy, p.idUser, p.idAccount]);
}

async function deactivateUser(conn, p) {
    const sql = `UPDATE users SET active = 0, updatedBy = ? WHERE idUser = ? AND idAccount = ? AND active = 1`;
    return query(conn, sql, [p.updatedBy, p.idUser, p.idAccount]);
}

module.exports = {
    getUsers,
    getRoles,
    getUser,
    getRole,
    findEmail,
    countOtherAdmins,
    createUser,
    updateUser,
    deactivateUser
};
