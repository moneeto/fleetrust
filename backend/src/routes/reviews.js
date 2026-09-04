const express = require('express');
const router = express.Router();
const { pool } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');
const db = require('../models/cmsModel.js');
const { parseTarget } = require('../helpers/cmsBrand.js');

function withPool(handler) {
    return (req, res) => {
        pool.getConnection(async (errConn, conn) => {
            let status = 400;
            let response = {};
            let connSuccess = false;
            try {
                if (errConn) throw errConn;
                connSuccess = true;
                const result = await handler(req, conn);
                status = 200;
                response = { ...result, success: true };
            } catch (e) {
                const message = typeof e === 'string' ? e : (e.message || 'Request failed');
                console.error('[reviews]', message);
                status = 400;
                response = { message, success: false };
            } finally {
                if (connSuccess) conn.release();
                res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
                res.removeHeader('ETag');
                res.status(status).send(response);
            }
        });
    };
}

function targetFrom(req) {
    return parseTarget(req.body?.target || req.query.target);
}

async function listReviews(req, conn) {
    const target = targetFrom(req);
    const reviews = await db.listReviews(conn, target);
    return { reviews };
}

async function createReview(req, conn) {
    const target = parseTarget(req.body?.target);
    const name = String(req.body?.name || '').trim();
    const review = String(req.body?.review || '').trim();
    const stars = Number(req.body?.stars);

    if (!name) throw 'Name is required';
    if (!review) throw 'Review text is required';
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw 'Stars must be between 1 and 5';

    const sortOrder = (await db.maxReviewSort(conn, target)) + 1;
    await db.insertReview(conn, { name, stars, review, target, sortOrder });
    const reviews = await db.listReviews(conn, target);
    return { reviews };
}

async function orderReviews(req, conn) {
    const target = parseTarget(req.body?.target);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    if (!ids.length) throw 'Missing ids';
    await db.updateReviewOrder(conn, target, ids);
    const reviews = await db.listReviews(conn, target);
    return { reviews };
}

async function deleteReview(req, conn) {
    const target = parseTarget(req.body?.target);
    const id = Number(req.body?.id);
    if (!id) throw 'Missing review id';
    await db.deleteReview(conn, id, target);
    const reviews = await db.listReviews(conn, target);
    return { reviews };
}

router.get('/', withAuth, withPool(listReviews));
router.post('/', withAuth, withPool(createReview));
router.post('/order', withAuth, withPool(orderReviews));
router.post('/delete', withAuth, withPool(deleteReview));

module.exports = router;
