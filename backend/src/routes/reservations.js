const express = require('express');
const Currency = require('currency.js');
const crypto = require('crypto');
const router = express.Router();
const db = require('../models/reservationsModel.js')
const dbAircrafts = require('../models/aircraftsModel.js')
const { poolTours } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')
const moment = require('moment');
const { generateBoardingPass } = require('../utils/boardingPass.js');
const { sendBookingDetails } = require('../utils/mailer.js');

function generateConfirmationHash(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) {
        out += chars[bytes[i] % chars.length];
    }
    return out;
}

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
router.post('/validateQrConfirmation', withAuth, validateQrConfirmation);
router.post('/qrBoardingPassPdf', withAuth, qrBoardingPassPdf);
router.post('/completeQrValidation', withAuth, completeQrValidation);

function qrReject(message, code, status = 400) {
    const e = new Error(message);
    e.code = code;
    e.status = status;
    return e;
}

function normalizeConfirmationHash(body) {
    const raw = body && (body.confirmationHash ?? body.confirmation_hash);
    return String(raw || '').trim();
}

function assertQrValidationEligible(rows) {
    const reservation = rows && rows[0];
    if (!reservation) throw qrReject('No reservation matches this code.', 'NOT_FOUND', 404);
    if (Number(reservation.idStatus) !== 3) {
        throw qrReject('Reservation is not confirmed yet, please try again in a while', 'INVALID_STATUS', 400);
    }
    if (Number(reservation.validatedQR) === 1) {
        throw qrReject('This reservation has already been checked in before.', 'ALREADY_VALIDATED', 400);
    }
    return reservation;
}

function experienceTitle(reservation) {
    return reservation.experience || reservation.route || 'Tour';
}

function passengersForBoardingPdf(passengerRows) {
    return (passengerRows || []).map((row) => ({
        name: row.name ?? '',
        lastname: row.lastName ?? row.lastname ?? ''
    }));
}

function passengersForQrPreview(passengerRows) {
    return (passengerRows || []).map((row) => ({
        idPassenger: row.idPassenger,
        name: row.name ?? '',
        lastName: row.lastName ?? row.lastname ?? ''
    }));
}

async function validateQrConfirmation(req, res) {
    poolTours.getConnection(async (errConn, conn) => {
        let response = { success: false };
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const hash = normalizeConfirmationHash(req.body);
            if (!hash) throw qrReject('Missing confirmation code.', 'MISSING_HASH', 400);
            const rows = await db.getReservationByConfirmationHash(conn, hash);
            const reservation = assertQrValidationEligible(rows);
            const passengerRows = await db.getPassengersByReservationId(conn, reservation.idReservation);
            response = {
                success: true,
                reservation: {
                    idReservation: reservation.idReservation,
                    codeReservation: reservation.codeReservation,
                    startDate: reservation.startDate,
                    title: experienceTitle(reservation),
                    holderName: [reservation.name, reservation.lastname].filter(Boolean).join(' ').trim() || null,
                    passengerCount: reservation.passengers,
                    passengers: passengersForQrPreview(passengerRows)
                }
            };
            status = 200;
        } catch (e) {
            console.log(e);
            const code = e.code || 'ERROR';
            const message = typeof e.message === 'string' ? e.message : 'Validation failed.';
            status = e.status || 400;
            response = { success: false, code, message };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).json(response);
        }
    });
}

async function qrBoardingPassPdf(req, res) {
    poolTours.getConnection(async (errConn, conn) => {
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const hash = normalizeConfirmationHash(req.body);
            if (!hash) throw qrReject('Missing confirmation code.', 'MISSING_HASH', 400);
            const rows = await db.getReservationByConfirmationHash(conn, hash);
            const reservation = assertQrValidationEligible(rows);
            const passengerRows = await db.getPassengersByReservationId(conn, reservation.idReservation);
            const passengers = passengersForBoardingPdf(passengerRows);
            if (!passengers.length) {
                throw qrReject('No passengers found for this reservation.', 'NO_PASSENGERS', 400);
            }
            const title = experienceTitle(reservation);
            const pdfBuffer = await generateBoardingPass(
                reservation.codeReservation,
                passengers,
                reservation.startDate,
                title,
                hash,
                reservation.passengers
            );
            const filename = `boarding_pass_${reservation.codeReservation}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.status(200).send(pdfBuffer);
        } catch (e) {
            console.log(e);
            const code = e.code || 'ERROR';
            const message = typeof e.message === 'string' ? e.message : 'Could not generate boarding pass.';
            const status = e.status || 400;
            if (!res.headersSent) {
                res.status(status).json({ success: false, code, message });
            }
        } finally {
            if (connSuccess) conn.release();
        }
    });
}

async function completeQrValidation(req, res) {
    poolTours.getConnection(async (errConn, conn) => {
        let response = { success: false };
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const hash = normalizeConfirmationHash(req.body);
            if (!hash) throw qrReject('Missing confirmation code.', 'MISSING_HASH', 400);
            const rows = await db.getReservationByConfirmationHash(conn, hash);
            assertQrValidationEligible(rows);
            const idReservation = rows[0].idReservation;
            const updateResult = await db.completeQrValidation(conn, idReservation);
            if (!updateResult || updateResult.affectedRows === 0) {
                throw qrReject(
                    'Could not complete check-in. The reservation may have been updated by another session.',
                    'UPDATE_CONFLICT',
                    409
                );
            }
            response = { success: true, message: 'Check-in completed successfully.' };
            status = 200;
        } catch (e) {
            console.log(e);
            const code = e.code || 'ERROR';
            const message = typeof e.message === 'string' ? e.message : 'Could not complete check-in.';
            status = e.status || 400;
            response = { success: false, code, message };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).json(response);
        }
    });
}

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

            // Sunset experience (SUN) can only be booked at 19:30 (Miami ET)
            if (String(experienceCode || '').trim().toUpperCase() === 'SUN' && reservationTime !== '19:30') {
                throw 'Sunset experience can only be booked at 19:30.'
            }

            //Check if booking is available
            const availabilityParams = {
                date: reservationDate,
                idAircraft: idAircraft && idAircraft !== 'all' ? idAircraft : null,
            };
            const availableHours = await db.getAvailableHours(conn, availabilityParams)
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

            // Debemos guardar tanto la ruta como la experiencia si corresponde.
            if (experienceCode && experienceCode?.length > 0) {
                routeCode = 'PRE'
            }
            if (!routeCode) throw 'Invalid route code'
            const route = await db.getRouteByCode(conn, routeCode)
            if (!route) throw 'No route found'

            const paxCount = Number(passengerCount) || (Array.isArray(passengers) ? passengers.length : 0) || 2;

            let experienceData = null;
            let totalValue = 0;

            if (experienceCode && experienceCode?.length > 0) {
                experienceData = await db.getExperienceByCode(conn, experienceCode)
                if (!experienceData || experienceData?.length === 0) throw 'Invalid experience code'
                const experience = experienceData[0];
                totalValue = paxCount == 2 ? experience.value2 : experience.value3;
                if (totalValue == null || totalValue === '') {
                    throw 'Selected experience is not available for this number of passengers.'
                }
            } else {
                totalValue = paxCount == 2 ? route.value2 : route.value3;
                if (totalValue == null || totalValue === '') {
                    throw 'Selected route is not available for this number of passengers.'
                }
            }

            totalValue = new Currency(totalValue).value;
            const deposit = 50;
            const remainingBalance = new Currency(totalValue).subtract(deposit).value;

            // reservation expiration (+ 15 minutes)
            const reservationExpiration = moment().utc().add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');

            // create reservation with idStatus = 1 (In progress)
            const insertResult = await db.createReservation(conn, {
                startDate,
                endDate,
                idRoute: route.idRoute,
                idExperience: experienceData ? experienceData[0].idExperience : null,
                passengerCount: paxCount,
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

            // Generate confirmation hash + email boarding pass (same flow as tours landing)
            const confirmationHash = generateConfirmationHash(10);
            await db.saveConfirmationHash(conn, {
                idReservation,
                confirmationHash,
            });

            const reservationRows = await db.getReservationById(conn, idReservation);
            const reservation = reservationRows && reservationRows[0];
            const passengerRows = await db.getPassengersByReservationId(conn, idReservation);
            const holderEmail = reservationHolder?.email || reservation?.email;

            if (reservation && holderEmail) {
                let mailPassengers = passengersForBoardingPdf(passengerRows);
                if (!mailPassengers.length && reservationHolder?.firstName) {
                    mailPassengers = [{
                        name: reservationHolder.firstName,
                        lastname: reservationHolder.lastName || '',
                    }];
                } else if (!mailPassengers.length && reservation.name) {
                    mailPassengers = [{
                        name: reservation.name,
                        lastname: reservation.lastname || '',
                    }];
                }

                try {
                    await sendBookingDetails({
                        codeReservation: reservation.codeReservation,
                        email: holderEmail,
                        passengers: mailPassengers,
                        passengerCount: reservation.passengers || mailPassengers.length,
                        startDate: reservation.startDate,
                        title: experienceTitle(reservation),
                        confirmationHash,
                    });
                } catch (mailErr) {
                    console.log('Error sending booking confirmation email:', mailErr);
                }
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
            const experienceCode = (req.query.experienceCode || '').toString().trim().toUpperCase();

            params = { date, idAircraft }

            if (!date) {
                throw 'Missing date.'
            }

            // lookup idTourType by code
            let availableHours = await db.getAvailableHours(conn, params)

            // Sunset experience (SUN) can only be booked at 19:30 (Miami ET)
            if (experienceCode === 'SUN') {
                availableHours = availableHours.filter(item => item.hour.substring(0, 5) === '19:30');
            }

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


function validateDateParam(d, label) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !moment(d, 'YYYY-MM-DD', true).isValid()) {
        throw `Invalid ${label}. Please use YYYY-MM-DD.`;
    }
    const minDate = moment('2000-01-01', 'YYYY-MM-DD');
    const maxDate = moment().add(1, 'years');
    const m = moment(d, 'YYYY-MM-DD');
    if (m.isBefore(minDate) || m.isAfter(maxDate)) {
        throw `Date out of allowed range. Use between ${minDate.format('YYYY-MM-DD')} and ${maxDate.format('YYYY-MM-DD')}`;
    }
}

async function getReservationsByDate(req, res) {
    poolTours.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            let dateFrom = req.query.dateFrom;
            let dateTo = req.query.dateTo;
            const dateLegacy = req.query.date;

            if (!dateFrom || !dateTo) {
                if (!dateLegacy) {
                    throw 'Missing date or date range (dateFrom & dateTo).'
                }
                validateDateParam(dateLegacy, 'date format');
                dateFrom = dateLegacy;
                dateTo = dateLegacy;
            } else {
                validateDateParam(dateFrom, 'dateFrom');
                validateDateParam(dateTo, 'dateTo');
                if (moment(dateFrom, 'YYYY-MM-DD').isAfter(moment(dateTo, 'YYYY-MM-DD'))) {
                    throw 'dateFrom cannot be after dateTo.';
                }
            }

            const filters = {};
            if (req.query.code != null && String(req.query.code).trim() !== '') {
                filters.codeReservation = String(req.query.code).trim();
            }
            if (req.query.client != null && String(req.query.client).trim() !== '') {
                filters.client = String(req.query.client).trim();
            }
            if (req.query.idAircraft != null && String(req.query.idAircraft).trim() !== '' && req.query.idAircraft !== 'all') {
                filters.idAircraft = req.query.idAircraft;
            }
            if (req.query.idRoute != null && String(req.query.idRoute).trim() !== '' && req.query.idRoute !== 'all') {
                filters.idRoute = req.query.idRoute;
            }

            const reservations = await db.getReservationsByDateRange(conn, dateFrom, dateTo, filters)

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
            if (!startDate || !endDate) {
                throw 'Missing required fields';
            }

            // Require a specific aircraft for range bookings (no 'all')
            if (!idAircraft || idAircraft === 'all' || isNaN(Number(idAircraft))) {
                throw 'Please select a aircraft.';
            }

            // Verificar solapamiento para el aircraft seleccionado
            const overlapping = await db.getReservationsInRange(conn, startDate, endDate, idAircraft);
            if (overlapping && overlapping.length > 0) {
                throw { overlapping, message: 'There are already reservations in this range.' };
            }
            
            const pilotRoute = await db.getRouteByCode(conn, '000');
            if (!pilotRoute) throw 'No route found for pilot booking.';

            // Crear reserva de bloqueo
            const insertResult = await db.createReservation(conn, {
                passengers: 0,
                startDate,
                endDate,
                idRoute: pilotRoute.idRoute,
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
                throw "Not authorized."
            }

            let { idReservation } = req.body;

            idReservation = idReservation != null && idReservation != "" ? idReservation : null

            if (!idReservation) {
                throw 'Missing reservation ID.';
            }

            // // Delete addons associated with the reservation
            // await db.deleteReservationAddons(conn, idReservation);

            // // Delete passengers associated with the reservation
            // await db.deleteReservationPassengers(conn, idReservation);

            // // Delete the reservation itself
            // await db.deleteReservation(conn, idReservation);

            await db.updateReservationStatus(conn, {idStatus: 4, idReservation: idReservation })

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