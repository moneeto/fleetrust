const express = require('express');
const router = express.Router();
const { pool } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');
const db = require('../models/cmsModel.js');
const { parseBrand } = require('../helpers/cmsBrand.js');
const { fetchPlaceDetails, mapGoogleReview } = require('../utils/googlePlaces.js');
const { placeIdForBrand } = require('../helpers/cmsBrand.js');

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

async function listReviews(req, conn) {
    const brand = parseBrand(req.query.brand);
    const reviews = await db.listReviews(conn, brand);
    const meta = await db.getPlaceMeta(conn, brand);
    return { reviews, meta };
}

async function syncReviews(req, conn) {
    const brand = parseBrand(req.body?.brand || req.query.brand);
    const placeId = placeIdForBrand(brand);
    const details = await fetchPlaceDetails(placeId);

    await db.upsertPlaceMeta(conn, {
        brand,
        rating: details.rating,
        userRatingsTotal: details.userRatingsTotal,
    });

    let inserted = 0;
    let updated = 0;
    let sortCursor = await db.maxReviewSort(conn, brand);

    for (const raw of details.reviews) {
        const mapped = mapGoogleReview(raw);
        const existing = await db.getReviewByGoogleId(conn, brand, mapped.googleReviewId);
        if (existing) {
            await db.updateReviewContent(conn, existing.id, mapped);
            updated += 1;
        } else {
            sortCursor += 1;
            await db.insertReview(conn, { ...mapped, brand, sortOrder: sortCursor });
            inserted += 1;
        }
    }

    const reviews = await db.listReviews(conn, brand);
    const meta = await db.getPlaceMeta(conn, brand);
    return { reviews, meta, inserted, updated };
}

async function updateReview(req, conn) {
    const brand = parseBrand(req.body?.brand);
    const id = Number(req.body?.id);
    if (!id) throw 'Missing review id';
    const existing = await db.getReviewById(conn, id, brand);
    if (!existing) throw 'Review not found';
    await db.updateReviewVisible(conn, id, brand, Boolean(req.body.visible));
    const reviews = await db.listReviews(conn, brand);
    return { reviews };
}

async function orderReviews(req, conn) {
    const brand = parseBrand(req.body?.brand);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    if (!ids.length) throw 'Missing ids';
    await db.updateReviewOrder(conn, brand, ids);
    const reviews = await db.listReviews(conn, brand);
    return { reviews };
}

router.get('/', withAuth, withPool(listReviews));
router.post('/sync', withAuth, withPool(syncReviews));
router.post('/update', withAuth, withPool(updateReview));
router.post('/order', withAuth, withPool(orderReviews));

module.exports = router;
