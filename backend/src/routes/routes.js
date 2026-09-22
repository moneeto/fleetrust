const express = require('express');
const Currency = require('currency.js');
const router = express.Router();
const db = require('../models/routesModel.js')
const bookingConfigDb = require('../models/bookingConfigModel.js')
const { poolTours } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')

router.get('/getRoutes', withAuth, getRoutes);

async function getRoutes(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            let params = {}

            const routes = await db.getRoutes(conn, params)
            await bookingConfigDb.attachRouteBooking(conn, routes)

            response = { success: true, routes }
            status = 200
        }
        catch (e) {
            console.log(e);
            let message = "An error has occurred while getting the routes.";
            if (typeof e == "string") { message = e }
            status = 400
            response = { success: false, message }
        }
        finally {
            if (connSuccess) conn.release()
            res.status(status).send(response)
        }
    })
}


module.exports = router;