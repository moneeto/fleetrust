const express = require('express');
const router = express.Router();
const db = require('../models/routesModel.js');
const { serializeWeekdays } = require('../utils/bookingConfig.js');
const { pool } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');

router.get('/getRoutes', withAuth, getRoutes);
router.post('/new', withAuth, createRoute);
router.post('/edit', withAuth, editRoute);
router.post('/delete', withAuth, deleteRoute);

function num(value, fallback) {
    if (value === '' || value == null) return fallback;
    return value;
}

function payload(body, idRoute) {
    return {
        idRoute,
        code: body.code,
        title: body.title,
        description: body.description || null,
        value2: num(body.value2, null),
        value3: num(body.value3, null),
        image: body.image || null,
        durationMinutes: num(body.durationMinutes, null),
        duration: body.duration || null,
        mapImage: body.mapImage || null,
        visibleToClients: body.visibleToClients ? 1 : 0,
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
            if (e && e.errno === 1451) message = 'This route is linked to other records and cannot be deleted.';
            response = { success: false, message };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function getRoutes(req, res) {
    withConn(res, 'An error has occurred while getting the routes.', async (conn) => {
        const includeDeleted = req.query.includeDeleted === '1' ? 1 : 0;
        const routes = await db.getRoutes(conn, includeDeleted);
        return { status: 200, body: { success: true, routes } };
    });
}

async function createRoute(req, res) {
    withConn(res, 'Error creating route.', async (conn) => {
        const row = payload(req.body);
        if (!row.code || !row.title) throw 'Missing required fields';
        await db.createRoute(conn, row);
        return { status: 200, body: { success: true, route: row } };
    });
}

async function editRoute(req, res) {
    withConn(res, 'Error updating route.', async (conn) => {
        const row = payload(req.body, req.body.idRoute);
        if (!row.idRoute || !row.code || !row.title) throw 'Missing required fields';
        const result = await db.updateRoute(conn, row);
        if (!result.affectedRows) throw 'Route not found';
        return { status: 200, body: { success: true, route: row } };
    });
}

async function deleteRoute(req, res) {
    withConn(res, 'Error deleting route.', async (conn) => {
        const { idRoute } = req.body;
        if (!idRoute) throw 'Missing required fields';
        const result = await db.deleteRoute(conn, idRoute);
        if (!result.affectedRows) throw 'Route not found';
        return { status: 200, body: { success: true } };
    });
}

module.exports = router;
