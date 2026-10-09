const express = require('express');
const router = express.Router();
const db = require('../models/availableHoursModel.js')
const { pool } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')

router.get('/', withAuth, getHours);
router.post('/edit', withAuth, editHour);

async function getHours(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const hours = await db.getHours(conn)

            response = { hours }

            status = 200
        }
        catch (e) {
            console.log(e)
            let message = "Error.";
            if (typeof e == "string") { message = e }
            status = 400
            response = { message }
        }
        finally {
            if (connSuccess) conn.release()
            res.status(status).send(response)
        }
    })
}

async function editHour(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { hour, active } = req.body;

            if (!hour) {
                throw 'Missing required fields'
            }

            const result = await db.updateHourActive(conn, {
                hour,
                active: active ? 1 : 0
            })

            if (!result.affectedRows) {
                throw 'Hour not found'
            }

            response = { hour: { hour, active: active ? 1 : 0 }, success: true }
            status = 200
        }
        catch (e) {
            let message = "Error updating hour.";
            if (typeof e == "string") { message = e }
            status = 400
            response = { message: message, success: false }
        }
        finally {
            if (connSuccess) conn.release()
            res.status(status).send(response)
        }
    })
}

module.exports = router;
