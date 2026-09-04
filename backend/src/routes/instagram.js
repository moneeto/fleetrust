const express = require('express');
const router = express.Router();
const { pool } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');
const db = require('../models/cmsModel.js');
const { parseBrand } = require('../helpers/cmsBrand.js');
const { parseInstagramPermalink, embedUrl } = require('../helpers/instagramPermalink.js');

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
                if (e && e.code === 'ER_DUP_ENTRY') {
                    response = { message: 'That Instagram post is already added', success: false };
                } else {
                    response = { message, success: false };
                }
            } finally {
                if (connSuccess) conn.release();
                res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
                res.removeHeader('ETag');
                res.status(status).send(response);
            }
        });
    };
}

function withEmbed(posts) {
    return posts.map((post) => ({
        ...post,
        embedUrl: embedUrl({
            mediaKind: post.media_kind || post.mediaKind,
            shortcode: post.shortcode,
        }),
    }));
}

async function listPosts(req, conn) {
    const brand = parseBrand(req.query.brand);
    const posts = withEmbed(await db.listInstagram(conn, brand));
    return { posts };
}

async function createPost(req, conn) {
    const brand = parseBrand(req.body?.brand);
    const parsed = parseInstagramPermalink(req.body?.permalink || req.body?.url);
    const sortOrder = (await db.maxInstagramSort(conn, brand)) + 1;
    await db.insertInstagram(conn, {
        brand,
        permalink: parsed.permalink,
        shortcode: parsed.shortcode,
        mediaKind: parsed.mediaKind,
        sortOrder,
    });
    const posts = withEmbed(await db.listInstagram(conn, brand));
    return { posts };
}

async function updatePost(req, conn) {
    const brand = parseBrand(req.body?.brand);
    const id = Number(req.body?.id);
    if (!id) throw 'Missing post id';
    const existing = await db.getInstagramById(conn, id, brand);
    if (!existing) throw 'Post not found';
    await db.updateInstagramVisible(conn, id, brand, Boolean(req.body.visible));
    const posts = withEmbed(await db.listInstagram(conn, brand));
    return { posts };
}

async function orderPosts(req, conn) {
    const brand = parseBrand(req.body?.brand);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    if (!ids.length) throw 'Missing ids';
    await db.updateInstagramOrder(conn, brand, ids);
    const posts = withEmbed(await db.listInstagram(conn, brand));
    return { posts };
}

async function deletePost(req, conn) {
    const brand = parseBrand(req.body?.brand);
    const id = Number(req.body?.id);
    if (!id) throw 'Missing post id';
    await db.deleteInstagram(conn, id, brand);
    const posts = withEmbed(await db.listInstagram(conn, brand));
    return { posts };
}

router.get('/', withAuth, withPool(listPosts));
router.post('/', withAuth, withPool(createPost));
router.post('/update', withAuth, withPool(updatePost));
router.post('/order', withAuth, withPool(orderPosts));
router.post('/delete', withAuth, withPool(deletePost));

module.exports = router;
