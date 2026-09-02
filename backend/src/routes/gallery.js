const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const withAuth = require('../middleware/withAuth.js');

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/tiff',
    'image/bmp',
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 20 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype) || file.mimetype.startsWith('image/')) {
            cb(null, true);
            return;
        }
        cb(new Error('Only image files are allowed'));
    },
});

function handleUpload(req, res, next) {
    upload.array('images', 20)(req, res, (err) => {
        if (err) {
            res.status(400).send({ message: err.message || 'Error uploading files', success: false });
            return;
        }
        next();
    });
}

router.get('/', withAuth, listImages);
router.get('/file/:filename', withAuth, getImage);
router.post('/upload', withAuth, handleUpload, uploadImages);
router.post('/delete', withAuth, deleteImage);

function galleryDir() {
    const dir = process.env.MNT_PHOTO_GALLERY;
    if (!dir) {
        throw 'MNT_PHOTO_GALLERY is not configured';
    }
    return dir;
}

async function ensureGalleryDir() {
    const dir = galleryDir();
    await fs.mkdir(dir, { recursive: true });
    return dir;
}

function safeFilename(name) {
    if (!name || typeof name !== 'string') {
        throw 'Invalid filename';
    }
    const base = path.basename(name);
    if (base !== name || base.includes('..') || !/^[a-zA-Z0-9._-]+\.(webp|jpg)$/i.test(base)) {
        throw 'Invalid filename';
    }
    return base;
}

function slugifyName(originalName) {
    const parsed = path.parse(originalName || '');
    const slug = (parsed.name || 'image')
        .normalize('NFKD')
        .replace(/[^\w\-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .toLowerCase();
    return slug || 'image';
}

async function listImages(req, res) {
    let response = {};
    let status = 400;

    try {
        const dir = await ensureGalleryDir();
        const entries = await fs.readdir(dir, { withFileTypes: true });

        const images = [];
        for (const entry of entries) {
            if (!entry.isFile() || (!entry.name.toLowerCase().endsWith('.webp') && !entry.name.toLowerCase().endsWith('.jpg'))) continue;
            try {
                safeFilename(entry.name);
            } catch {
                continue;
            }
            const stats = await fs.stat(path.join(dir, entry.name));
            images.push({
                filename: entry.name,
                size: stats.size,
                modifiedAt: stats.mtime.toISOString(),
            });
        }

        images.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));

        response = { images, success: true };
        status = 200;
    } catch (e) {
        let message = 'Error listing gallery images.';
        if (typeof e === 'string') { message = e; }
        status = 400;
        response = { message, success: false };
    }

    res.status(status).send(response);
}

async function getImage(req, res) {
    try {
        const dir = await ensureGalleryDir();
        const filename = safeFilename(req.params.filename);
        const filePath = path.join(dir, filename);

        await fs.access(filePath);

        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Cache-Control', 'private, max-age=3600');
        res.type('image/webp');
        res.sendFile(path.resolve(filePath));
    } catch (e) {
        const message = typeof e === 'string' ? e : 'Image not found';
        res.status(404).send({ message, success: false });
    }
}

async function uploadImages(req, res) {
    let response = {};
    let status = 400;

    try {
        const dir = await ensureGalleryDir();
        const files = req.files || [];

        if (!files.length) {
            throw 'No images were uploaded';
        }

        const saved = [];

        for (const file of files) {
            const filename = `${slugifyName(file.originalname)}-${Date.now()}-${saved.length}.webp`;
            const dest = path.join(dir, filename);

            await sharp(file.buffer)
                .rotate()
                .webp({ quality: 82 })
                .toFile(dest);

            const stats = await fs.stat(dest);
            saved.push({
                filename,
                size: stats.size,
                modifiedAt: stats.mtime.toISOString(),
            });
        }

        response = { images: saved, success: true };
        status = 200;
    } catch (e) {
        let message = 'Error uploading gallery images.';
        if (typeof e === 'string') { message = e; }
        else if (e && e.message) { message = e.message; }
        status = 400;
        response = { message, success: false };
    }

    res.status(status).send(response);
}

async function deleteImage(req, res) {
    let response = {};
    let status = 400;

    try {
        const dir = await ensureGalleryDir();
        const filename = safeFilename(req.body.filename);
        await fs.unlink(path.join(dir, filename));

        response = { success: true };
        status = 200;
    } catch (e) {
        let message = 'Error deleting gallery image.';
        if (typeof e === 'string') { message = e; }
        status = 400;
        response = { message, success: false };
    }

    res.status(status).send(response);
}

module.exports = router;
