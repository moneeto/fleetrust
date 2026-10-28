const express = require('express');
const router = express.Router();
const db = require('../models/businessHoursModel.js');
const { pool } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');
const checkAccount = require('../middleware/checkAccount.js');
const checkAdmin = require('../middleware/checkAdmin.js');

router.get('/', withAuth, checkAccount, getHours);
router.post('/', withAuth, checkAccount, checkAdmin, saveHours);

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutes(value) {
    const [hours, mins] = String(value).slice(0, 5).split(':').map(Number);
    return hours * 60 + mins;
}

function rowsFromBody(body) {
    const days = Array.isArray(body.days) ? body.days : null;
    if (!days || days.length !== 7) throw 'Send all seven days.';
    const seen = new Set();
    const rows = [];
    for (const day of days) {
        const n = Number(day.day);
        if (!Number.isInteger(n) || n < 0 || n > 6 || seen.has(n)) throw 'Each day from Sunday to Saturday is required.';
        seen.add(n);
        const available = day.available === 1 || day.available === true || day.available === '1' ? 1 : 0;
        const intervals = Array.isArray(day.intervals) ? day.intervals : [];
        const spans = [];
        for (const interval of intervals) {
            const hourFrom = String(interval.hourFrom || '').slice(0, 5);
            const hourTo = String(interval.hourTo || '').slice(0, 5);
            if (!TIME.test(hourFrom) || !TIME.test(hourTo)) throw 'Use HH:mm for each interval.';
            const from = minutes(hourFrom);
            const to = minutes(hourTo);
            if (to <= from) throw 'End time must be after start time.';
            spans.push({ from, to, hourFrom, hourTo });
        }
        spans.sort((a, b) => a.from - b.from);
        for (let i = 1; i < spans.length; i++) {
            if (spans[i].from < spans[i - 1].to) throw 'Intervals on the same day cannot overlap.';
        }
        for (const span of spans) {
            rows.push({ day: n, hourFrom: span.hourFrom, hourTo: span.hourTo, available });
        }
    }
    return rows;
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

async function getHours(req, res) {
    withConn(res, 'An error has occurred while getting availability.', async (conn) => {
        const hours = await db.getByAccount(conn, req.idAccount);
        return { status: 200, body: { success: true, hours } };
    });
}

async function saveHours(req, res) {
    withConn(res, 'Error saving availability.', async (conn) => {
        const rows = rowsFromBody(req.body);
        await new Promise((resolve, reject) => conn.beginTransaction((err) => err ? reject(err) : resolve()));
        try {
            await db.deleteByAccount(conn, req.idAccount);
            for (const row of rows) {
                await db.insertRow(conn, { ...row, idAccount: req.idAccount, idUser: req.idUser });
            }
            await new Promise((resolve, reject) => conn.commit((err) => err ? reject(err) : resolve()));
        } catch (e) {
            await new Promise((resolve) => conn.rollback(() => resolve()));
            throw e;
        }
        return { status: 200, body: { success: true } };
    });
}

module.exports = router;
