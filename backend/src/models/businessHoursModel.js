function query(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getByAccount(conn, idAccount) {
    return query(
        conn,
        `SELECT id, day, TIME_FORMAT(hourFrom, '%H:%i') AS hourFrom, TIME_FORMAT(hourTo, '%H:%i') AS hourTo, available
         FROM business_hours
         WHERE idAccount = ?
         ORDER BY day, hourFrom`,
        [idAccount]
    );
}

async function getForDay(conn, idAccount, day, available) {
    return query(
        conn,
        `SELECT TIME_FORMAT(hourFrom, '%H:%i') AS hourFrom, TIME_FORMAT(hourTo, '%H:%i') AS hourTo
         FROM business_hours
         WHERE idAccount = ? AND day = ? AND available = ?
         ORDER BY hourFrom`,
        [idAccount, day, available]
    );
}

async function deleteByAccount(conn, idAccount) {
    return query(conn, `DELETE FROM business_hours WHERE idAccount = ?`, [idAccount]);
}

async function insertRow(conn, row) {
    return query(
        conn,
        `INSERT INTO business_hours (day, hourFrom, hourTo, available, idAccount, createdBy, updatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [row.day, row.hourFrom, row.hourTo, row.available, row.idAccount, row.idUser, row.idUser]
    );
}

async function copyDefaults(conn, idAccount) {
    return query(
        conn,
        `INSERT INTO business_hours (day, hourFrom, hourTo, available, idAccount)
         SELECT day, hourFrom, hourTo, available, ? FROM business_hours_default`,
        [idAccount]
    );
}

module.exports = {
    getByAccount,
    getForDay,
    deleteByAccount,
    insertRow,
    copyDefaults
};
