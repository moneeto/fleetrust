const express = require('express');
const router = express.Router();
const db = require('../models/experiencesModel.js');
const { serializeWeekdays } = require('../utils/bookingConfig.js');
const { pool } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');

router.get('/getExperiences', withAuth, getExperiences);
router.post('/new', withAuth, createExperience);
router.post('/edit', withAuth, editExperience);
router.post('/delete', withAuth, deleteExperience);

function num(value, fallback) {
    if (value === '' || value == null) return fallback;
    return value;
}

function payload(body, idExperience) {
    return {
        idExperience,
        code: body.code,
        title: body.title,
        description: body.description || null,
        value2: num(body.value2, null),
        value3: num(body.value3, null),
        image: body.image || null,
        minDaysAhead: num(body.minDaysAhead, 1),
        maxDaysAhead: num(body.maxDaysAhead, 31),
        allowedWeekdays: serializeWeekdays(body.allowedWeekdays)
    };
}

function withConn(res, failMessage, fn) {
    pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const result = await fn(conn);
            response = result.body;
            status = result.status;
        } catch (e) {
            console.log(e);
            let message = failMessage;
            if (typeof e == 'string') message = e;
            if (e && e.errno === 1451) message = 'This experience is linked to other records and cannot be deleted.';
            response = { success: false, message };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function getExperiences(req, res) {
    withConn(res, 'An error has occurred while getting the experiences.', async (conn) => {
        const includeDeleted = req.query.includeDeleted === '1' ? 1 : 0;
        const experiences = await db.getExperiences(conn, includeDeleted);
        return { status: 200, body: { success: true, experiences } };
    });
}

async function createExperience(req, res) {
    withConn(res, 'Error creating experience.', async (conn) => {
        const row = payload(req.body);
        if (!row.code || !row.title) throw 'Missing required fields';
        await db.createExperience(conn, row);
        return { status: 200, body: { success: true, experience: row } };
    });
}

async function editExperience(req, res) {
    withConn(res, 'Error updating experience.', async (conn) => {
        const row = payload(req.body, req.body.idExperience);
        if (!row.idExperience || !row.code || !row.title) throw 'Missing required fields';
        const result = await db.updateExperience(conn, row);
        if (!result.affectedRows) throw 'Experience not found';
        return { status: 200, body: { success: true, experience: row } };
    });
}

async function deleteExperience(req, res) {
    withConn(res, 'Error deleting experience.', async (conn) => {
        const { idExperience } = req.body;
        if (!idExperience) throw 'Missing required fields';
        const result = await db.deleteExperience(conn, idExperience);
        if (!result.affectedRows) throw 'Experience not found';
        return { status: 200, body: { success: true } };
    });
}

module.exports = router;
