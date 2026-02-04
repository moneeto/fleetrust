const express = require('express');
const Currency = require('currency.js');
const router = express.Router();
const db = require('../models/reservationsModel.js')
const { poolTours } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')

router.post('/createReservation', withAuth, createReservation);
router.get('/availableHours', withAuth, getAvailableHours);
router.get('/reservationsByDate', withAuth, getReservationsByDate);
router.get('/reservationsByAircraft', withAuth, getReservationsByAircraft);
router.post('/getReservationById', withAuth, getReservationById);


async function createReservation(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { reservationDate, reservationTime, passengerCount, passengers, notes, reservationHolder } = req.body;

            if (!reservationDate || !reservationTime) {
                throw 'Missing required fields'
            }

            //Check if booking is available
            const availableHours = await db.getAvailableHours(conn, reservationDate)
            const isAvailable = availableHours.some(item => item.hour.substring(0, 5) === reservationTime);
            if (!isAvailable) throw 'No availability for the selected date and time. Please choose another option.'

            const name = reservationHolder.firstName && reservationHolder.firstName != null ? reservationHolder.firstName : req.name;
            const lastname = reservationHolder.lastName && reservationHolder.lastName != null ? reservationHolder.lastName : req.surname;

            const insertResult = await db.createReservation(conn, {
                startDate: reservationDate + ' ' + reservationTime + ':00',
                reservationTime,
                name,
                lastname,
                idStatus: 3,
                notes: notes ? notes : null,
                passengers: passengerCount
            })

            // ---Solo si estamos haciendo la reserva para tours---
            if(reservationHolder && Object.keys(reservationHolder).length > 0 && reservationHolder.firstName != "" && reservationHolder.lastName != ""  && reservationHolder.email != "" && reservationHolder.phone != "") {
                await db.updateReservationHolder(conn, {...reservationHolder, idReservation: insertResult.insertId})
            }

            if (passengers && passengers.length > 0) {
                let ps = []
                for (let i = 0; i < passengers.length; i++) {
                    let passenger = passengers[i];
                    ps.push([passenger.firstName, passenger.lastName, insertResult.insertId]);
                }
                await db.insertPassengers(conn, {passengers: ps})
            }
            // ----------------------------------------------------
            response = { id: insertResult.insertId, success: true }
            status = 200
        }
        catch (e) {
            let message = "Error creating reservation.";
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
            let message = "Error has occurred while retrieving reservations.";
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


async function getReservationsByAircraft(req, res) {
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

            //Get aircrafts
            let aircarfts = await db.getAircrafts(conn);

            for (let i = 0; i < aircarfts.length; i++) {
                let aircraft = aircarfts[i];
                let reservations = await db.getReservationsByAircraft(conn, date, aircraft.idAircraft);
                aircraft.flights = reservations;
            }

            // lookup idTourType by code
            const reservations = await db.getReservationsByDate(conn, date)

            response = { reservations }

            status = 200
        }
        catch (e) {
            let message = "Error has occurred while retrieving reservations.";
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

async function getReservationById(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const id = req.body.id;

            if (!id) {
                throw 'Missing id.'
            }

            // lookup idTourType by code
            const [reservation] = await db.getReservationById(conn, id)

            const passengers = await db.getPassengersByReservationId(conn, id);

            reservation.passengers = passengers;

            response = reservation

            status = 200
        }
        catch (e) {
            let message = "An error has occurred while retrieving the reservation.";
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



module.exports = router;