const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../models/pilotsModel.js')
const { pool } = require('../helpers/conexion-mysql.js')
const withAuth = require('../middleware/withAuth.js')
const checkAccount = require('../middleware/checkAccount.js')

const uploadDir = path.join(__dirname, '../uploads/pilots');

if (!fsSync.existsSync(uploadDir)) {
    fsSync.mkdirSync(uploadDir, { recursive: true });
}

function slugifyName(originalName) {
    const parsed = path.parse(originalName);
    const slug = parsed.name
        .normalize('NFKD')
        .replace(/[^\w\-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .toLowerCase();
    return slug || 'pilot';
}

function safeFilename(name) {
    if (!name || typeof name !== 'string') {
        throw 'Invalid filename';
    }
    const base = path.basename(name);
    if (base !== name || base.includes('..') || !/^[a-zA-Z0-9._-]+\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(base)) {
        throw 'Invalid filename';
    }
    return base;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${slugifyName(file.originalname)}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
            return;
        }
        cb(new Error('Only image files are allowed'));
    }
});

function handleUpload(req, res, next) {
    upload.single('pilotPicture')(req, res, (err) => {
        if (err) {
            res.status(400).send({ message: err.message, success: false });
            return;
        }
        next();
    });
}

router.get('/', withAuth, checkAccount, getPilots);
router.get('/photo/:filename', withAuth, checkAccount, getPilotPhoto);
router.post('/edit', withAuth, checkAccount, handleUpload, editPilot);
router.post('/new', withAuth, checkAccount, handleUpload, createPilot);
router.post('/delete', withAuth, checkAccount, deletePilot);

async function removePilotFile(filename) {
    const safe = safeFilename(filename);
    const filePath = path.join(uploadDir, safe);
    try {
        await fs.access(filePath);
    } catch {
        return;
    }
    await fs.unlink(filePath);
}

async function createPilot(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { pilotName, phoneNumber, active } = req.body;

            if (!pilotName) {
                throw 'Missing required fields'
            }

            const pilotPicture = req.file ? req.file.filename : null

            await db.createPilot(conn, {
                pilotName,
                pilotPicture,
                phoneNumber,
                active: active == '1' ? 1 : 0,
                idAccount: req.idAccount
            })

            response = { pilot: { pilotName, pilotPicture, phoneNumber, active }, success: true }
            status = 200
        }
        catch (e) {
            let message = "Error creating pilot.";
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

async function editPilot(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { idPilot, pilotName, phoneNumber, active } = req.body;

            if (!idPilot || !pilotName) {
                throw 'Missing required fields'
            }

            const [current] = await db.getPilotById(conn, idPilot, req.idAccount)
            if (!current) {
                throw 'Pilot not found'
            }

            let pilotPicture = current.pilotPicture
            if (req.file) {
                pilotPicture = req.file.filename
                if (current.pilotPicture && !String(current.pilotPicture).startsWith('data:')) {
                    await removePilotFile(current.pilotPicture)
                }
            }

            await db.updatePilot(conn, {
                idPilot,
                pilotName,
                pilotPicture,
                phoneNumber,
                active: active == '1' ? 1 : 0,
                idAccount: req.idAccount
            })

            response = { pilot: { idPilot, pilotName, pilotPicture, phoneNumber, active }, success: true }
            status = 200
        }
        catch (e) {
            let message = "Error updating pilot information.";
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

async function getPilots(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const includeDeleted = req.query.includeDeleted === '1' ? 1 : 0;
            const pilots = await db.getPilots(conn, includeDeleted, req.idAccount)

            response = { pilots }

            status = 200
        }
        catch (e) {
            console.log(e)
            let message = "Error.";
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

async function getPilotPhoto(req, res) {
    try {
        const filename = safeFilename(req.params.filename);
        const filePath = path.join(uploadDir, filename);

        await fs.access(filePath);

        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Cache-Control', 'private, max-age=3600');
        res.sendFile(path.resolve(filePath));
    } catch (e) {
        const message = typeof e === 'string' ? e : 'Image not found';
        res.status(404).send({ message, success: false });
    }
}

async function deletePilot(req, res) {
    pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let connSuccess = false

        try {

            if (errConn) throw errConn
            connSuccess = true

            const { idPilot } = req.body;

            if (!idPilot) {
                throw 'Missing required fields'
            }

            const [pilot] = await db.getPilotById(conn, idPilot, req.idAccount)
            if (!pilot) {
                throw 'Pilot not found'
            }

            const result = await db.deletePilot(conn, idPilot, req.idAccount)

            if (!result.affectedRows) {
                throw 'Pilot not found'
            }

            if (pilot.pilotPicture && !String(pilot.pilotPicture).startsWith('data:')) {
                await removePilotFile(pilot.pilotPicture)
            }

            response = { success: true }
            status = 200
        }
        catch (e) {
            let message = "Error deleting pilot.";
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

module.exports = router;
