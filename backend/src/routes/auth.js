const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const connection = require('../helpers/conexion-mysql')
const db = require('../models/authModel.js')
const servicesDb = require('../models/servicesModel.js')
const { addLog } = require('../helpers/addLog.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { verifyRecaptcha } = require('../utils/recaptcha.js');
const { newOtpCode, otpExpiresAt, otpAccepts } = require('../utils/otp.js');
const { sendOtpEmail, sendRecoveryEmail } = require('../utils/mailer.js');
const withAuth = require('../middleware/withAuth.js');
const checkAccount = require('../middleware/checkAccount.js');

router.post('/login', login);
router.get('/logout', logout);
router.post('/register', register);
router.post('/verifyEmail', verifyEmail);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);
router.get('/setup', withAuth, checkAccount, getSetup);
router.post('/setup/dismiss', withAuth, checkAccount, dismissSetup);

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    ...(process.env.COOKIE_DOMAIN && {
        domain: process.env.COOKIE_DOMAIN
    })
};

async function login(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {

        let response = {}
        let status = 400
        let errMsg = "An internal error has ocurred, please try again or contact support."
        let connSuccess = false

        try {
            if (errConn) throw errConn

            connSuccess = true

            let params = {
                email: cleanEmail(req.body.email),
                password: req.body.password && req.body.password != null ? req.body.password : null
            }

            if (!params.email || !params.password) {
                errMsg = "Invalid email or password. Please, verify your credentials and try again."
                throw "No se envio email y/o contraseña"
            }

            const captchaResults = await verifyRecaptcha(req.body.captchaToken, 'login');
            if (!captchaResults.success) {
                errMsg = "Authentication error. The system detected suspicious activity."
                throw Error("reCAPTCHA verification failed")
            }

            let userData = await db.getUserByEmail(conn, params)

            if (!userData || !userData[0] || !userData[0].idUser) {
                errMsg = "Invalid email or password. Please, verify your credentials and try again."
                throw `No se ha encontrado el usuario ${params.email}`
            }

            encryptionPayload = {
                idUser: userData[0].idUser,
                username: userData[0].username,
                email: userData[0].email,
                idRole: userData[0].idRole,
                role: userData[0].role,
                code: userData[0].code,
                name: userData[0].name,
                surname: userData[0].surname,
                active: userData[0].active,
                resetPassword: userData[0].resetPassword,
                idAccount: userData[0].idAccount
            };

            if (parseInt(userData[0].active) == 0) {
                //Significa que es usuario inactivo, no deberia poder logear
                errMsg = "Invalid email or password. Please, verify your credentials and try again."
                throw "No tiene permisos y/o usuario inactivo."
            }

            //Verifico la password
            const match = await bcrypt.compare(params.password, userData[0].password);
            if (!match) {
                errMsg = "Invalid email or password. Please, verify your credentials and try again."
                throw `Contraseña incorrecta para el usuario ${params.email}`
            }

            //Genero el token

            const token = jwt.sign(encryptionPayload, process.env.SECRET_STRING, { expiresIn: process.env.TOKEN_EXPIRATION });

            let expires = moment().add(120, 'days').toDate()

            res.cookie('token', token, {
                ...cookieOptions,
                expires
            });

            let reestablecer_password = userData[0].resetPassword
            if (reestablecer_password == 1) {
                status = 200
                response = { mensaje: "Your account needs a password update, please change it.", data: { ...encryptionPayload, resetPassword: 1 } }
            } else {
                status = 200
                response = {
                    mensaje: "Welcome!", data: {}
                }
            }

        }
        catch (e) {
            let msg = errMsg;
            console.log(e)
            if (typeof e == String) { msg = e }
            if (e.message) { msg = e.message }
            if (typeof msg == "object") { msg = JSON.stringify(msg) }
            status = 500
            response = { status: "err", message: msg }
        }
        finally {
            if (connSuccess) conn.release()
            res.status(status).send(response)
        }
    })
}

async function logout(req, res) {
    res.clearCookie('token', cookieOptions);
    res.status(200).send({})
}

function cleanEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function issueOtp(conn, email, purpose) {
    await db.deactivateExpiredOtp(conn);
    await db.deactivateOtpForEmail(conn, { email, purpose });
    const code = newOtpCode();
    const hash = await bcrypt.hash(code, 12);
    await db.insertOtp(conn, { email, code: hash, purpose, expiresAt: otpExpiresAt() });
    await sendOtpEmail({ email, code, purpose });
}

async function matchingOtp(conn, email, purpose, code) {
    await db.deactivateExpiredOtp(conn);
    const rows = await db.getActiveOtps(conn, { email, purpose });
    const now = new Date();
    for (const row of rows) {
        if (!otpAccepts(row, purpose, now)) continue;
        if (await bcrypt.compare(String(code || ''), row.code)) return row;
    }
    return null;
}

async function register(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        let started = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;

            const email = cleanEmail(req.body.email);
            const password = req.body.password;
            if (!validEmail(email) || !password || String(password).length < 8) {
                throw 'Enter a valid email and a password of at least 8 characters.';
            }

            const captchaResults = await verifyRecaptcha(req.body.captchaToken, 'register');
            if (!captchaResults.success) {
                throw 'Authentication error. The system detected suspicious activity.';
            }

            const existing = await db.getUserByEmail(conn, { email });
            if (existing[0] && Number(existing[0].active) === 1) {
                throw 'Email already registered.';
            }

            await new Promise((resolve, reject) => conn.beginTransaction((err) => err ? reject(err) : resolve()));
            started = true;

            if (!existing[0]) {
                const roles = await db.getRoleByCode(conn, 'ADM');
                if (!roles[0]) throw 'Administrator role is not configured.';
                const account = await db.createAccount(conn, { name: email, showSetupModal: 1 });
                await servicesDb.createService(conn, {
                    code: 'MANUAL', title: 'Manual Booking', description: null, image: null, duration: null,
                    durationMinutes: 60, visibleToClients: 0, minDaysAhead: 0, maxDaysAhead: 365,
                    allowedWeekdays: '[0,1,2,3,4,5,6]', idAccount: account.insertId
                });
                const hash = await bcrypt.hash(String(password), 12);
                await db.createUser(conn, {
                    username: email,
                    email,
                    password: hash,
                    idRole: roles[0].idRole,
                    idAccount: account.insertId,
                    active: 0
                });
            } else {
                const hash = await bcrypt.hash(String(password), 12);
                await db.updatePendingPassword(conn, { email, password: hash });
            }

            await issueOtp(conn, email, 'REGISTER');
            await new Promise((resolve, reject) => conn.commit((err) => err ? reject(err) : resolve()));
            started = false;
            status = 200;
            response = { message: 'We sent a code to your email.' };
        } catch (e) {
            if (started) {
                await new Promise((resolve) => conn.rollback(() => resolve()));
            }
            console.log(e);
            status = 400;
            response = { message: typeof e === 'string' ? e : 'Could not create the account.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function verifyEmail(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const email = cleanEmail(req.body.email);
            const row = await matchingOtp(conn, email, 'REGISTER', req.body.code);
            if (!row) throw 'Invalid or expired code.';
            await db.activateUser(conn, { email });
            await db.deactivateOtpById(conn, row.idOtp);
            const users = await db.getUserByEmail(conn, { email });
            const user = users[0];
            if (!user || Number(user.active) !== 1) throw 'Could not verify the email.';
            const token = jwt.sign({
                idUser: user.idUser,
                username: user.username,
                email: user.email,
                idRole: user.idRole,
                role: user.role,
                code: user.code,
                name: user.name,
                surname: user.surname,
                active: user.active,
                resetPassword: user.resetPassword,
                idAccount: user.idAccount
            }, process.env.SECRET_STRING, { expiresIn: process.env.TOKEN_EXPIRATION });
            res.cookie('token', token, {
                ...cookieOptions,
                expires: moment().add(120, 'days').toDate()
            });
            status = 200;
            response = { message: 'Welcome!' };
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not verify the email.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

function recoveryHash(token) {
    return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

async function forgotPassword(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = { message: 'If this email belongs to an account, you will receive an email to continue with the recovery.' };
        let status = 200;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const email = cleanEmail(req.body.email);
            if (!validEmail(email)) throw 'Enter a valid email.';
            const existing = await db.getUserByEmail(conn, { email });
            const user = existing[0];
            if (user && Number(user.active) === 1) {
                const token = crypto.randomBytes(32).toString('hex');
                await db.deactivateRecoveryForUser(conn, { idUser: user.idUser });
                await db.insertRecovery(conn, { idUser: user.idUser, token: recoveryHash(token), expiresAt: otpExpiresAt() });
                const base = String(process.env.FRONTEND_URL || '').replace(/\/$/, '');
                await sendRecoveryEmail({ email, link: `${base}/reset-password?token=${token}` });
            }
        } catch (e) {
            console.log(e);
            if (typeof e === 'string') {
                status = 400;
                response = { message: e };
            }
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function resetPassword(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const password = req.body.password;
            if (!password || String(password).length < 8) {
                throw 'Enter a password of at least 8 characters.';
            }
            if (password !== req.body.passwordConfirm) throw 'Passwords do not match.';
            const rows = await db.getActiveRecovery(conn, { token: recoveryHash(req.body.token) });
            const row = rows[0];
            if (!row) throw 'This link is invalid or has expired.';
            const hash = await bcrypt.hash(String(password), 12);
            const updated = await db.updatePassword(conn, { idUser: row.idUser, password: hash });
            if (!updated.affectedRows) throw 'This link is invalid or has expired.';
            await db.deactivateRecoveryById(conn, row.idRecovery);
            status = 200;
            response = { message: 'Password updated. You can sign in.' };
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not reset the password.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function getSetup(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const rows = await db.getSetupStatus(conn, req.idAccount);
            if (!rows[0]) throw 'Account not found.';
            status = 200;
            response = rows[0];
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not load the setup status.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function dismissSetup(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            await db.setSetupModal(conn, { value: 0, idAccount: req.idAccount });
            status = 200;
            response = { message: 'Setup closed.' };
        } catch (e) {
            console.log(e);
            response = { message: 'Could not close the setup.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

module.exports = router
