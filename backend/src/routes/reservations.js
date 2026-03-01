const express = require('express');
const Currency = require('currency.js');
const router = express.Router();
const db = require('../models/reservationsModel.js')
const dbAircrafts = require('../models/aircraftsModel.js')
const { poolTours } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')
const moment = require('moment');

router.post('/createReservation', withAuth, createReservation);
router.post('/confirmBooking', withAuth, confirmBooking);
router.get('/availableHours', withAuth, getAvailableHours);
router.get('/reservationsByDate', withAuth, getReservationsByDate);
router.get('/reservationsByAircraft', withAuth, getReservationsByAircraft);
router.post('/getReservationById', withAuth, getReservationById);
router.post('/updateReservation', withAuth, updateReservation);
router.post('/checkAvailability', withAuth, checkAvailability);
router.post('/createReservationRange', withAuth, createReservationRange);
router.post('/deleteReservation', withAuth, deleteReservation);

async function createReservation(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true
            console.log(req.body);
            let { experienceCode, routeCode, reservationDate, reservationTime, passengerCount, passengers, notes, reservationHolder, idAircraft } = req.body;

            if (!reservationDate || !reservationTime) {
                throw 'Missing required fields'
            }
            //Check if booking is available
            const availableHours = await db.getAvailableHours(conn, { date: reservationDate })
            const isAvailable = availableHours.some(item => item.hour.substring(0, 5) === reservationTime);
            if (!isAvailable) throw 'No availability for the selected date and time. Please choose another option.'

            const name = reservationHolder.firstName && reservationHolder.firstName != null ? reservationHolder.firstName : req.name;
            const lastname = reservationHolder.lastName && reservationHolder.lastName != null ? reservationHolder.lastName : req.surname;
            const startDate = moment(`${reservationDate} ${reservationTime}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm');
            const endDate = moment(startDate, 'YYYY-MM-DD HH:mm').add(1, 'hours').format('YYYY-MM-DD HH:mm');

            if (!idAircraft || idAircraft == "all") {
                // Get aircraft
                const aircrafts = await db.getAircrafts(conn, startDate, endDate);
                idAircraft = aircrafts[0].idAircraft;
            }


            // const insertResult = await db.createReservation(conn, {
            //     startDate: reservationDate + ' ' + reservationTime + ':00',
            //     reservationTime,
            //     name,
            //     lastname,
            //     idStatus: 3,
            //     notes: notes ? notes : null,
            //     passengers: passengerCount
            // })

            // Debemos guardar tanto la ruta como la experiencia si corresponde. Tambien cambiamos el formato de fecha desde-hasta de la reserva.

            // lookup route data by code
            if (experienceCode && experienceCode?.length > 0) {
                routeCode = 'PRE'
            }
            if (!routeCode) throw 'Invalid route code'
            const route = await db.getRouteByCode(conn, routeCode)
            if (!route) throw 'No route found'

            // Get base value
            let baseValue = 0;
            let experienceValue = 0;
            if (passengers == 2) {
                baseValue = route.value2;
            }
            else {
                baseValue = route.value3;
            }

            const totalValue = new Currency(baseValue).add(experienceValue).value;
            const deposit = 50;
            const remainingBalance = new Currency(totalValue).subtract(deposit).value;

            // Get special experience data
            let experienceData;
            if (experienceCode && experienceCode?.length > 0) {
                experienceData = await db.getExperienceByCode(conn, experienceCode)
                if (!experienceData || experienceData?.length === 0) throw 'Invalid experience code'
                experienceValue = experienceData[0].value;
            }

            // reservation expiration (+ 15 minutes)
            const reservationExpiration = moment().utc().add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');

            // create reservation with idStatus = 1 (In progress)
            const insertResult = await db.createReservation(conn, {
                startDate,
                endDate,
                idRoute: route.idRoute,
                idExperience: experienceData ? experienceData.idExperience : null,
                passengerCount,
                idStatus: 1,
                totalValue,
                deposit,
                remainingBalance,
                reservationExpiration,
                idAircraft: idAircraft
            })
            // NOTE: reservation holder update and passenger insertion are handled
            // by the /confirmBooking endpoint to allow creating a draft reservation
            // (status = 1) first and confirming later.
            // ----------------------------------------------------
            response = { id: insertResult.insertId, success: true }
            status = 200
        }
        catch (e) {
            console.log(e);
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

async function confirmBooking(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {
            if (errConn) throw errConn
            connSuccess = true

            const { idReservation, passengers, reservationHolder, notes } = req.body;

            if (!idReservation) throw 'Missing reservation ID.'


            console.log(req.body);
            await db.updateReservationStatus(conn, { idStatus: 3, idReservation: idReservation })

            if (notes && String(notes).trim() != "") {
                await db.updateReservationNotes(conn, { notes: notes, idReservation: idReservation })
            }
            // Update reservation holder if provided
            if (reservationHolder && Object.keys(reservationHolder).length > 0) {
                await db.updateReservationHolder(conn, { ...reservationHolder, idReservation });
            }

            // Insert passengers if provided
            if (passengers && passengers.length > 0) {
                let ps = []
                for (let i = 0; i < passengers.length; i++) {
                    let passenger = passengers[i];
                    ps.push([passenger.firstName, passenger.lastName, idReservation]);
                }
                await db.insertPassengers(conn, { passengers: ps })
            }

            response = { success: true }
            status = 200
        }
        catch (e) {
            console.log(e);
            let message = "Error confirming reservation.";
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

            let params = {}
            const date = req.query.date;
            const idAircraft = req.query.idAircraft && req.query.idAircraft != null && req.query.idAircraft != "all" ? req.query.idAircraft : null

            params = { date, idAircraft }

            if (!date) {
                throw 'Missing date.'
            }

            // lookup idTourType by code
            const availableHours = await db.getAvailableHours(conn, params)

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

            // Validate date format (strict) and reasonable range
            // Expected format: YYYY-MM-DD
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !moment(date, 'YYYY-MM-DD', true).isValid()) {
                throw 'Invalid date format. Please use YYYY-MM-DD.';
            }

            const minDate = moment('2000-01-01', 'YYYY-MM-DD');
            const maxDate = moment().add(1, 'years'); // allow up to one year in the future
            const mDate = moment(date, 'YYYY-MM-DD');

            if (mDate.isBefore(minDate) || mDate.isAfter(maxDate)) {
                throw `Date out of allowed range. Use between ${minDate.format('YYYY-MM-DD')} and ${maxDate.format('YYYY-MM-DD')}`;
            }

            // lookup idTourType by code
            const reservations = await db.getReservationsByDate(conn, date)

            response = { reservations }

            status = 200
        }
        catch (e) {
            console.log(e);
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

async function updateReservation(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { idReservation, name, lastname, email, phoneNumber, notes, startDate, endDate, idRoute, idExperience, idAircraft } = req.body;

            if (!idReservation) {
                throw 'Missing reservation ID.'
            }

            // If startDate or endDate are being updated, validate no overlaps exist
            if (startDate && endDate && idAircraft) {
                const overlaps = await db.checkReservationOverlap(conn, startDate, endDate, idAircraft, idReservation);
                if (overlaps && overlaps.length > 0) {
                    throw `There is already a reservation scheduled for the aircraft during this time period. Overlapping reservation: ${overlaps[0].codeReservation}`;
                }
            }

            const updateResult = await db.updateReservation(conn, {
                idReservation,
                name,
                lastname,
                email,
                phoneNumber,
                notes,
                startDate,
                endDate,
                idRoute,
                idExperience,
                idAircraft
            })

            response = { success: true, message: 'Reservation updated successfully' }
            status = 200
        }
        catch (e) {
            console.log(e);
            let message = "An error has occurred while updating the reservation.";
            if (typeof e == "string") { message = String(e) }
            status = 400
            response = { success: false, message: message }
        }
        finally {
            if (connSuccess) conn.release()
            res.status(status).send(response)
        }
    })
}

async function checkAvailability(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { startDate, endDate, idAircraft } = req.body;

            if (!startDate || !endDate || !idAircraft) {
                throw 'Missing required fields (startDate, endDate, idAircraft)'
            }

            // Check for overlapping reservations
            const overlapping = await db.getReservationsInRange(conn, startDate, endDate, idAircraft);

            const hasConflict = overlapping && overlapping.length > 0;

            response = {
                available: !hasConflict,
                conflict: hasConflict,
                conflictCount: overlapping ? overlapping.length : 0
            }

            status = 200
        }
        catch (e) {
            console.log(e)
            let message = "Error checking availability.";
            if (typeof e == "string") { message = e }
            status = 400
            response = { message, available: false, conflict: true }
        }
        finally {
            if (connSuccess) conn.release()
            res.status(status).send(response)
        }
    })
}

async function createReservationRange(req, res) {
    poolTours.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            let { startDate, endDate, idAircraft, notes } = req.body;
            if (!startDate || !endDate || !idAircraft) {
                throw 'Missing required fields';
            }
            // Verificar solapamiento
            const overlapping = await db.getReservationsInRange(conn, startDate, endDate, idAircraft);
            if (idAircraft == "all") {
                // Si es para "all", con que haya 1 avion que 
                // no aparezca entre las reservas solapadas, es suficiente para crear la reserva.
                const aircrafts = await dbAircrafts.getAircrafts(conn);
                let availableAircrafts = aircrafts.filter(n => n.available == 1).map(n => n.idAircraft);
                let avionesReservados = new Set();
                overlapping.forEach(r => {
                    if (r.idAircraft) avionesReservados.add(r.idAircraft);
                });
                if (availableAircrafts.length == avionesReservados.size) {
                    throw { overlapping, message: 'There are already reservations in this range for all available aircraft.' }
                }

                // Tengo avion disponible, selecciono el primero que encuentre
                for (let i = 0; i < availableAircrafts.length; i++) {
                    if (!avionesReservados.has(availableAircrafts[i])) {
                        idAircraft = availableAircrafts[i];
                        break;
                    }
                }
            }
            else {
                if (overlapping && overlapping.length > 0) {
                    throw { overlapping, message: 'There are already reservations in this range.' };
                }
            }
            
            // Crear reserva de bloqueo
            const insertResult = await db.createReservation(conn, {
                passengers: 0,
                startDate,
                endDate,
                idRoute: null,
                idExperience: null,
                idStatus: 3, // Confirmed
                totalValue: 0,
                deposit: 0,
                remainingBalance: 0,
                reservationExpiration: null,
                idAircraft,
                notes
            });
            response = { success: true, id: insertResult.insertId };
            status = 200;

        } catch (e) {
            console.log(e)
            let message = 'Error blocking aircraft range.';
            if (typeof e === 'string') message = e;
            response.message = message;
            if (e.overlapping) {
                response = { ...e }
            }
            status = 400;
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}


async function deleteReservation(req, res) {
    poolTours.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;

        try {
            if (errConn) throw errConn;
            connSuccess = true;

            if (req.idRole != 1) {
                throw "No authorized."
            }

            const { idReservation } = req.body;

            if (!idReservation) {
                throw 'Missing reservation ID.';
            }

            // Delete addons associated with the reservation
            await db.deleteReservationAddons(conn, idReservation);

            // Delete passengers associated with the reservation
            await db.deleteReservationPassengers(conn, idReservation);

            // Delete the reservation itself
            await db.deleteReservation(conn, idReservation);

            response = { success: true, message: 'Reservation deleted successfully' };
            status = 200;
        } catch (e) {
            let message = 'An error occurred while deleting the reservation.';
            if (typeof e === 'string') message = e;
            status = 400;
            response = { success: false, message };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}


module.exports = router;