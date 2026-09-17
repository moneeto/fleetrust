const express = require('express');
const router = express.Router();
const db = require('../models/experiencesModel.js');
const bookingConfigDb = require('../models/bookingConfigModel.js');
const { poolTours } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');

router.get('/getExperiences', withAuth, getExperiences);

async function getExperiences(req, res) {
    poolTours.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;

        try {
            if (errConn) throw errConn;
            connSuccess = true;

            const experiences = await db.getExperiences(conn);
            await bookingConfigDb.attachExperienceBooking(conn, experiences);
            response = { success: true, experiences };
            status = 200;
        } catch (e) {
            console.log(e);
            let message = 'An error has occurred while getting the experiences.';
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
