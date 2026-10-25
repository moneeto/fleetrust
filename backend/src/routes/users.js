const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../models/usersModel.js');
const { pool } = require('../helpers/conexion-mysql.js');
const withAuth = require('../middleware/withAuth.js');
const checkAccount = require('../middleware/checkAccount.js');
const checkAdmin = require('../middleware/checkAdmin.js');
const { userChangeError } = require('../utils/userChangeError.js');

router.get('/', withAuth, checkAccount, checkAdmin, getUsers);
router.post('/new', withAuth, checkAccount, checkAdmin, createUser);
router.post('/edit', withAuth, checkAccount, checkAdmin, editUser);
router.post('/delete', withAuth, checkAccount, checkAdmin, deleteUser);

function cleanEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readUser(body, passwordRequired) {
    const name = String(body.name || '').trim();
    const surname = String(body.surname || '').trim();
    const email = cleanEmail(body.email);
    const idRole = Number(body.idRole);
    const active = body.active ? 1 : 0;
    const password = body.password ? String(body.password) : '';
    if (!name || !surname) throw 'Enter the first and last name.';
    if (!validEmail(email)) throw 'Enter a valid email.';
    if (!idRole) throw 'Select a role.';
    if (passwordRequired && password.length < 8) throw 'Enter a password of at least 8 characters.';
    if (password && password.length < 8) throw 'Enter a password of at least 8 characters.';
    return { name, surname, email, idRole, active, password };
}

async function guardChange(conn, req, target, active, code) {
    const otherActiveAdmins = await db.countOtherAdmins(conn, req.idAccount, target.idUser);
    const message = userChangeError(req.idUser, target, { active, code, otherActiveAdmins });
    if (message) throw message;
}

async function getUsers(req, res) {
    pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const users = await db.getUsers(conn, req.idAccount);
            const roles = await db.getRoles(conn);
            response = { users, roles, idUser: req.idUser };
            status = 200;
        } catch (e) {
            console.log(e);
            status = 400;
            response = { message: typeof e === 'string' ? e : 'Error.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function createUser(req, res) {
    pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const fields = readUser(req.body, true);
            const role = await db.getRole(conn, fields.idRole);
            if (!role) throw 'Select a role.';
            const taken = await db.findEmail(conn, fields.email);
            if (taken) throw 'Email already registered.';
            const password = await bcrypt.hash(fields.password, 12);
            await db.createUser(conn, {
                name: fields.name,
                surname: fields.surname,
                email: fields.email,
                password,
                idRole: fields.idRole,
                active: fields.active,
                idAccount: req.idAccount,
                idUser: req.idUser
            });
            response = { success: true };
            status = 200;
        } catch (e) {
            console.log(e);
            status = 400;
            response = { message: typeof e === 'string' ? e : 'Error creating user.', success: false };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function editUser(req, res) {
    pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const idUser = Number(req.body.idUser);
            if (!idUser) throw 'Missing required fields';
            const fields = readUser(req.body, false);
            const target = await db.getUser(conn, idUser, req.idAccount);
            if (!target) throw 'User not found';
            const role = await db.getRole(conn, fields.idRole);
            if (!role) throw 'Select a role.';
            const taken = await db.findEmail(conn, fields.email);
            if (taken && Number(taken.idUser) !== idUser) throw 'Email already registered.';
            await guardChange(conn, req, target, fields.active, role.code);
            const password = fields.password ? await bcrypt.hash(fields.password, 12) : target.password;
            await db.updateUser(conn, {
                idUser,
                idAccount: req.idAccount,
                name: fields.name,
                surname: fields.surname,
                email: fields.email,
                password,
                idRole: fields.idRole,
                active: fields.active,
                updatedBy: req.idUser
            });
            response = { success: true };
            status = 200;
        } catch (e) {
            console.log(e);
            status = 400;
            response = { message: typeof e === 'string' ? e : 'Error updating user.', success: false };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function deleteUser(req, res) {
    pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const idUser = Number(req.body.idUser);
            if (!idUser) throw 'Missing required fields';
            const target = await db.getUser(conn, idUser, req.idAccount);
            if (!target) throw 'User not found';
            await guardChange(conn, req, target, 0, target.code);
            const result = await db.deactivateUser(conn, {
                idUser,
                idAccount: req.idAccount,
                updatedBy: req.idUser
            });
            if (!result.affectedRows) throw 'User not found';
            response = { success: true };
            status = 200;
        } catch (e) {
            console.log(e);
            status = 400;
            response = { message: typeof e === 'string' ? e : 'Error deactivating user.', success: false };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

module.exports = router;
