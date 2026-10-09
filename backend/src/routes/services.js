const express = require('express');
const router = express.Router();
const db = require('../models/servicesModel.js');
const { serializeWeekdays } = require('../utils/bookingConfig.js');
const { pool } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');

router.get('/getServices', withAuth, getServices);
router.post('/new', withAuth, createService);
router.post('/edit', withAuth, editService);
router.post('/delete', withAuth, deleteService);

function num(value, fallback) {
    if (value === '' || value == null) return fallback;
    return value;
}

function payload(body, idService) {
    const visible = body.visibleToClients === true || body.visibleToClients === 1 || body.visibleToClients === '1';
    return {
        idService,
        code: body.code,
        title: body.title,
        description: body.description || null,
        image: body.image || null,
        duration: body.duration || null,
        durationMinutes: num(body.durationMinutes, null),
        visibleToClients: visible ? 1 : 0,
        minDaysAhead: num(body.minDaysAhead, 1),
        maxDaysAhead: num(body.maxDaysAhead, 31),
        allowedWeekdays: serializeWeekdays(body.allowedWeekdays)
    };
}

function priceRows(body) {
    const rows = Array.isArray(body.prices) ? body.prices : [];
    const list = [];
    for (const row of rows) {
        if (row.passengers === '' || row.passengers == null) continue;
        if (row.price === '' || row.price == null) continue;
        list.push({ passengers: Number(row.passengers), price: Number(row.price) });
    }
    return list;
}

function hourRows(body) {
    const rows = Array.isArray(body.hours) ? body.hours : [];
    const list = [];
    for (const hour of rows) {
        const value = String(hour || '').trim();
        if (value) list.push(value);
    }
    return list;
}

function addonRows(body) {
    const rows = Array.isArray(body.addons) ? body.addons : [];
    const list = [];
    for (const idAddon of rows) {
        if (idAddon === '' || idAddon == null) continue;
        list.push(Number(idAddon));
    }
    return list;
}

async function saveChildren(conn, idService, body) {
    await db.deleteServicePrices(conn, idService);
    await db.deleteServiceHours(conn, idService);
    await db.deleteServiceAddons(conn, idService);
    for (const row of priceRows(body)) {
        await db.insertServicePrice(conn, idService, row.passengers, row.price);
    }
    for (const hour of hourRows(body)) {
        await db.insertServiceHour(conn, idService, hour);
    }
    for (const idAddon of addonRows(body)) {
        await db.insertServiceAddon(conn, idService, idAddon);
    }
}

function attachChildren(services, prices, hours, addons) {
    for (const service of services) {
        service.prices = [];
        service.hours = [];
        service.addons = [];
    }
    for (const row of prices) {
        const service = services.find((item) => item.idService === row.idService);
        if (service) service.prices.push({ passengers: Number(row.passengers), price: Number(row.price) });
    }
    for (const row of hours) {
        const service = services.find((item) => item.idService === row.idService);
        if (service) service.hours.push(row.hour);
    }
    for (const row of addons) {
        const service = services.find((item) => item.idService === row.idService);
        if (service) service.addons.push(row.idAddon);
    }
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
            response = { success: false, message };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function getServices(req, res) {
    withConn(res, 'An error has occurred while getting the services.', async (conn) => {
        const includeDeleted = req.query.includeDeleted === '1' ? 1 : 0;
        const services = await db.getServices(conn, includeDeleted);
        const prices = await db.getServicePrices(conn);
        const hours = await db.getServiceHours(conn);
        const addons = await db.getServiceAddons(conn);
        attachChildren(services, prices, hours, addons);
        return { status: 200, body: { success: true, services } };
    });
}

async function createService(req, res) {
    withConn(res, 'Error creating service.', async (conn) => {
        const row = payload(req.body);
        if (!row.code || !row.title) throw 'Missing required fields';
        const result = await db.createService(conn, row);
        await saveChildren(conn, result.insertId, req.body);
        return { status: 200, body: { success: true, idService: result.insertId } };
    });
}

async function editService(req, res) {
    withConn(res, 'Error updating service.', async (conn) => {
        const row = payload(req.body, req.body.idService);
        if (!row.idService || !row.code || !row.title) throw 'Missing required fields';
        const result = await db.updateService(conn, row);
        if (!result.affectedRows) throw 'Service not found';
        await saveChildren(conn, row.idService, req.body);
        return { status: 200, body: { success: true } };
    });
}

async function deleteService(req, res) {
    withConn(res, 'Error deleting service.', async (conn) => {
        const { idService } = req.body;
        if (!idService) throw 'Missing required fields';
        const result = await db.deleteService(conn, idService);
        if (!result.affectedRows) throw 'Service not found';
        return { status: 200, body: { success: true } };
    });
}

module.exports = router;
