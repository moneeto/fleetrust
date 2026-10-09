const express = require('express');
const router = express.Router();
const db = require('../models/addonsModel.js')
const { pool } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')

router.get('/', withAuth, getAddons);
router.post('/edit', withAuth, editAddon);
router.post('/new', withAuth, createAddon);
router.post('/delete', withAuth, deleteAddon);


async function createAddon(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { addon, description, price, active } = req.body;

            if (!addon || !price) {
                throw 'Missing required fields'
            }

            await db.createAddon(conn, {
                addon,
                description,
                price,
                active: active ? 1 : 0
            })

            response = { addon: { addon, description, price, active }, success: true }
            status = 200
        }
        catch (e) {
            let message = "Error creating addon.";
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

async function editAddon(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { idAddon, addon, description, price, active } = req.body;

            if (!idAddon || !addon || !price) {
                throw 'Missing required fields'
            }

            await db.updateAddon(conn, {
                idAddon,
                addon,
                description,
                price,
                active: active ? 1 : 0
            })

            response = { addon: { idAddon, addon, description, price, active }, success: true }
            status = 200
        }
        catch (e) {
            let message = "Error updating addon information.";
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

async function getAddons(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const includeDeleted = req.query.includeDeleted === '1' ? 1 : 0;
            const addons = await db.getAddons(conn, includeDeleted)

            response = { addons }

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


async function deleteAddon(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { idAddon } = req.body;

            if (!idAddon) {
                throw 'Missing required fields'
            }

            const result = await db.deleteAddon(conn, idAddon)

            if (!result.affectedRows) {
                throw 'Addon not found'
            }

            response = { success: true }
            status = 200
        }
        catch (e) {
            let message = "Error deleting addon.";
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
