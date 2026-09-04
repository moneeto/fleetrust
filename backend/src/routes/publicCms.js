const express = require('express');
const router = express.Router();
const { pool } = require('../helpers/conexion-mysql.js');
const db = require('../models/cmsModel.js');
const { parseBrand, parseTarget } = require('../helpers/cmsBrand.js');
const { embedUrl } = require('../helpers/instagramPermalink.js');

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
                console.error('[publicCms]', message);
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

router.get('/reviews', withPool(async (req, conn) => {
    const target = parseTarget(req.query.target);
    const reviews = await db.listReviews(conn, target);
    return { reviews };
}));

router.get('/instagram', withPool(async (req, conn) => {
    const brand = parseBrand(req.query.brand);
    const posts = (await db.listVisibleInstagram(conn, brand)).map((post) => ({
        ...post,
        embedUrl: embedUrl({
            mediaKind: post.media_kind || post.mediaKind,
            shortcode: post.shortcode,
        }),
    }));
    return { posts };
}));

module.exports = router;
