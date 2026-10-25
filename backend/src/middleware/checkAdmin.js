const { pool } = require('../helpers/conexion-mysql.js');
const db = require('../models/authModel.js');

function checkAdmin(req, res, next) {
    if (!req.idUser || !req.idAccount) {
        res.status(403).send({ status: 'error', message: 'Unauthorized account' });
        return;
    }

    pool.getConnection(async (errConn, conn) => {
        if (errConn) {
            res.status(500).send({ status: 'error', message: 'Unauthorized account' });
            return;
        }
        try {
            const rows = await db.getActiveUserRole(conn, {
                idUser: req.idUser,
                idAccount: req.idAccount
            });
            if (!rows.length || rows[0].code !== 'ADM') {
                res.status(403).send({ status: 'error', message: 'Insufficient permissions.' });
                return;
            }
            next();
        } catch (e) {
            console.log(e);
            res.status(500).send({ status: 'error', message: 'Unauthorized account' });
        } finally {
            conn.release();
        }
    });
}

module.exports = checkAdmin;
