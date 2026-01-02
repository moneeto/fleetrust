const express = require('express');
const Currency = require('currency.js');
const router = express.Router();
const db = require('../models/reservationsModel.js')
const { poolTours } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')

router.post('/createReservation', withAuth, createReservation);
router.get('/availableHours', withAuth, getAvailableHours);
router.get('/reservationsByDate', withAuth, getReservationsByDate);

async function createReservation(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { reservationDate, reservationTime } = req.body;

            if (!reservationDate || !reservationTime) {
                throw 'Missing required fields'
            }

            //Check if booking is available
            const availableHours = await db.getAvailableHours(conn, reservationDate)
            const isAvailable = availableHours.some(item => item.hour.substring(0, 5) === reservationTime);
            if (!isAvailable) throw 'No availability for the selected date and time. Please choose another option.'

            // create reservation with idStatus = 3 (Confirmed)
            const insertResult = await db.createReservation(conn, {
                reservationDate,
                reservationTime,
                name: req.name,
                lastname: req.surname,
                idStatus: 3
            })

            response = { id: insertResult.insertId }
            status = 200
        }
        catch (e) {
            console.log(e);
            let mensaje = "Error creating reservation.";
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

async function getAvailableHours(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const date = req.query.date;

            if (!date) {
                throw 'Missing date.'
            }

            // lookup idTourType by code
            const availableHours = await db.getAvailableHours(conn, date)

            response = { availableHours: availableHours.map(item => item.hour.substring(0, 5)) }

            status = 200
        }
        catch (e) {
            console.log(e);
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


async function getReservationsByDate(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const date = req.query.date;

            if (!date) {
                throw 'Missing date.'
            }

            // lookup idTourType by code
            const reservations = await db.getReservationsByDate(conn, date)

            response = { reservations }

            status = 200
        }
        catch (e) {
            console.log(e);
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

module.exports = router;