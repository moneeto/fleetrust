const express = require('express');
const router = express.Router();
const db = require('../models/aircraftsModel.js')
const { pool } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')
const checkAccount = require('../middleware/checkAccount.js')

router.get('/', withAuth, checkAccount, getAircrafts);
router.post('/edit', withAuth, checkAccount, editAircraft);
router.post('/new', withAuth, checkAccount, createAircraft);
router.post('/delete', withAuth, checkAccount, deleteAircraft);
router.post('/restore', withAuth, checkAccount, restoreAircraft);


async function createAircraft(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { aircraft, capacity, registrationNumber, available } = req.body;

            if (!aircraft || !capacity || !registrationNumber) {
                throw 'Missing required fields'
            }

            await db.createAircraft(conn, {
                aircraft,
                capacity,
                registrationNumber,
                available: available ? 1 : 0,
                idAccount: req.idAccount,
                idUser: req.idUser
            })

            response = { aircraft: { aircraft, capacity, registrationNumber, available }, success: true }
            status = 200
        }
        catch (e) {
            let message = "Error updating aircraft information.";
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
async function editAircraft(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { idAircraft, aircraft, capacity, registrationNumber, available } = req.body;

            if (!idAircraft || !aircraft || !capacity || !registrationNumber) {
                throw 'Missing required fields'
            }

            await db.updateAircraft(conn, {
                idAircraft,
                aircraft,
                capacity,
                registrationNumber,
                available: available ? 1 : 0,
                idAccount: req.idAccount,
                idUser: req.idUser
            })

            response = { aircraft: { idAircraft, aircraft, capacity, registrationNumber, available }, success: true }
            status = 200
        }
        catch (e) {
            let message = "Error updating aircraft information.";
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

async function getAircrafts(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const includeDeleted = (req.query.includeDeleted === '1' || req.query.includeDeleted === 'true') ? 1 : 0;
            const aircrafts = await db.getAircrafts(conn, includeDeleted, req.idAccount)

            response = { aircrafts }

            status = 200
        }
        catch (e) {
            console.log(e)
            let mensaje = "Error.";
            if (typeof e == "string") { mensaje = e }
            status = 400
            response = { mensaje }
        }
        finally {
            if (connSuccess) conn.release()
            res.status(status).send(response)
        }
    })
}


async function deleteAircraft(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { idAircraft } = req.body;

            if (!idAircraft) {
                throw 'Missing required fields'
            }

            const result = await db.deleteAircraft(conn, idAircraft, req.idAccount, req.idUser)

            if (!result.affectedRows) {
                throw 'Aircraft not found or already deleted'
            }

            response = { success: true }
            status = 200
        }
        catch (e) {
            let message = "Error deleting aircraft.";
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

async function restoreAircraft(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { idAircraft } = req.body;

            if (!idAircraft) {
                throw 'Missing required fields'
            }

            const result = await db.restoreAircraft(conn, idAircraft, req.idAccount, req.idUser)

            if (!result.affectedRows) {
                throw 'Aircraft not found or not deleted'
            }

            response = { success: true }
            status = 200
        }
        catch (e) {
            let message = "Error restoring aircraft.";
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