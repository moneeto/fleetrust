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
const { OAuth2Client } = require('google-auth-library');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const { googleAudiences, webauthnOrigins } = require('../utils/authConfig.js');

router.post('/login', login);
router.get('/logout', logout);
router.post('/register', register);
router.post('/verifyEmail', verifyEmail);
router.post('/googleLogin', googleLogin);
router.post('/biometricLoginOptions', biometricLoginOptions);
router.post('/biometricLogin', biometricLogin);
router.get('/biometricStatus', withAuth, checkAccount, getBiometricStatus);
router.post('/biometricRegisterOptions', withAuth, checkAccount, biometricRegisterOptions);
router.post('/biometricRegister', withAuth, checkAccount, biometricRegister);
router.get('/profile', withAuth, checkAccount, getProfile);
router.post('/profile', withAuth, checkAccount, updateProfile);
router.post('/changePassword', withAuth, checkAccount, changePassword);
router.post('/biometricRemove', withAuth, checkAccount, biometricRemove);
router.post('/biometricSkip', withAuth, checkAccount, biometricSkip);
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

            if (!userData[0].password) {
                errMsg = "Invalid email or password. Please, verify your credentials and try again."
                throw `El usuario ${params.email} no tiene contraseña`
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
            console.log(e)
            status = 500
            response = { status: "err", message: errMsg }
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

async function issueOtp(conn, email, purpose, passwordHash) {
    await db.deactivateExpiredOtp(conn);
    await db.deactivateOtpForEmail(conn, { email, purpose });
    const code = newOtpCode();
    const hash = await bcrypt.hash(code, 12);
    await db.insertOtp(conn, { email, code: hash, purpose, expiresAt: otpExpiresAt(), passwordHash });
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
            if (existing[0]) throw 'Email already registered.';

            // Nothing is created yet: the password hash waits in the code row until the email is verified.
            const hash = await bcrypt.hash(String(password), 12);
            await issueOtp(conn, email, 'REGISTER', hash);
            status = 200;
            response = { message: 'We sent a code to your email.' };
        } catch (e) {
            console.log(e);
            status = 400;
            response = { message: typeof e === 'string' ? e : 'Could not create the account.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

function startSession(res, user) {
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
}

async function createOwner(conn, p) {
    const roles = await db.getRoleByCode(conn, 'ADM');
    if (!roles[0]) throw 'Administrator role is not configured.';
    const account = await db.createAccount(conn, { name: p.email, showSetupModal: 1 });
    await servicesDb.createService(conn, {
        code: 'MANUAL', title: 'Manual Booking', description: null, image: null, duration: null,
        durationMinutes: 60, startTime: '08:00', endTime: '20:00', visibleToClients: 0, minDaysAhead: 0, maxDaysAhead: 365,
        allowedWeekdays: '[0,1,2,3,4,5,6]', idAccount: account.insertId
    });
    await db.createUser(conn, {
        username: p.email,
        email: p.email,
        password: p.password,
        googleId: p.googleId,
        idRole: roles[0].idRole,
        idAccount: account.insertId,
        active: 1,
        askBiometric: 1
    });
}

async function verifyEmail(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        let started = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const email = cleanEmail(req.body.email);
            const row = await matchingOtp(conn, email, 'REGISTER', req.body.code);
            if (!row || !row.passwordHash) throw 'Invalid or expired code.';
            const existing = await db.getUserByEmail(conn, { email });
            if (existing[0]) throw 'Email already registered.';

            await new Promise((resolve, reject) => conn.beginTransaction((err) => err ? reject(err) : resolve()));
            started = true;
            await createOwner(conn, { email, password: row.passwordHash, googleId: null });
            await db.deactivateOtpById(conn, row.idOtp);
            await new Promise((resolve, reject) => conn.commit((err) => err ? reject(err) : resolve()));
            started = false;

            const users = await db.getUserByEmail(conn, { email });
            const user = users[0];
            if (!user || Number(user.active) !== 1) throw 'Could not verify the email.';
            startSession(res, user);
            status = 200;
            response = { message: 'Welcome!' };
        } catch (e) {
            if (started) await new Promise((resolve) => conn.rollback(() => resolve()));
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
            await db.setSetupModal(conn, { value: 0, idAccount: req.idAccount, idUser: req.idUser });
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

const googleClient = new OAuth2Client();
const challengeCookie = 'webauthnChallenge';
const challengeMinutes = 5;

function saveChallenge(res, challenge) {
    const token = jwt.sign({ challenge }, process.env.SECRET_STRING, { expiresIn: `${challengeMinutes}m` });
    res.cookie(challengeCookie, token, { ...cookieOptions, maxAge: challengeMinutes * 60 * 1000 });
}

function takeChallenge(req, res) {
    res.clearCookie(challengeCookie, cookieOptions);
    try {
        return jwt.verify(req.cookies[challengeCookie], process.env.SECRET_STRING).challenge;
    } catch (e) {
        throw 'The request expired. Try again.';
    }
}

async function googleLogin(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        let started = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;

            const ticket = await googleClient.verifyIdToken({ idToken: req.body.idToken, audience: googleAudiences() });
            const claims = ticket.getPayload();
            if (!claims.email_verified) throw 'Your Google email is not verified.';
            const googleId = claims.sub;
            const email = cleanEmail(claims.email);

            let user = (await db.getUserByGoogleId(conn, { googleId }))[0];
            if (!user) {
                user = (await db.getUserByEmail(conn, { email }))[0];
                if (user && user.googleId) throw 'This email is linked to another Google account.';
                if (user && Number(user.active) === 1) {
                    await db.linkGoogle(conn, { googleId, idUser: user.idUser });
                } else if (!user) {
                    await new Promise((resolve, reject) => conn.beginTransaction((err) => err ? reject(err) : resolve()));
                    started = true;
                    await createOwner(conn, { email, password: null, googleId });
                    await new Promise((resolve, reject) => conn.commit((err) => err ? reject(err) : resolve()));
                    started = false;
                    user = (await db.getUserByEmail(conn, { email }))[0];
                }
            }
            if (!user || Number(user.active) !== 1) throw 'Your account is inactive.';

            startSession(res, user);
            status = 200;
            response = { message: 'Welcome!' };
        } catch (e) {
            if (started) await new Promise((resolve) => conn.rollback(() => resolve()));
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not sign in with Google.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function getBiometricStatus(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const rows = await db.getBiometricStatus(conn, { idUser: req.idUser });
            if (!rows[0]) throw 'User not found.';
            status = 200;
            response = rows[0];
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not load the biometric status.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function biometricRegisterOptions(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const passkeys = await db.getPasskeysByUser(conn, { idUser: req.idUser });
            const options = await generateRegistrationOptions({
                rpName: process.env.WEBAUTHN_RP_NAME,
                rpID: process.env.WEBAUTHN_RP_ID,
                userName: req.username,
                userID: new TextEncoder().encode(String(req.idUser)),
                excludeCredentials: passkeys.map((row) => ({
                    id: row.credentialId,
                    transports: row.transports ? row.transports.split(',') : undefined
                })),
                authenticatorSelection: { residentKey: 'required', userVerification: 'required' }
            });
            saveChallenge(res, options.challenge);
            status = 200;
            response = options;
        } catch (e) {
            console.log(e);
            response = { message: 'Could not start the biometric setup.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function biometricRegister(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const verification = await verifyRegistrationResponse({
                response: req.body,
                expectedChallenge: takeChallenge(req, res),
                expectedOrigin: webauthnOrigins(),
                expectedRPID: process.env.WEBAUTHN_RP_ID,
                requireUserVerification: true
            });
            if (!verification.verified) throw 'Could not register the biometric login.';
            const credential = verification.registrationInfo.credential;
            await db.insertPasskey(conn, {
                idUser: req.idUser,
                credentialId: credential.id,
                publicKey: Buffer.from(credential.publicKey).toString('base64url'),
                counter: credential.counter,
                transports: credential.transports ? credential.transports.join(',') : null
            });
            await db.setAskBiometric(conn, { value: 0, idUser: req.idUser });
            status = 200;
            response = { message: 'Biometric login enabled.' };
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not register the biometric login.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function getProfile(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const rows = await db.getProfile(conn, { idUser: req.idUser });
            if (!rows[0]) throw 'User not found.';
            status = 200;
            response = rows[0];
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not load your profile.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function updateProfile(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const name = String(req.body.name || '').trim();
            const surname = String(req.body.surname || '').trim();
            if (!name || !surname) throw 'Enter your first and last name.';
            await db.updateProfile(conn, { name, surname, idUser: req.idUser });
            status = 200;
            response = { message: 'Personal information updated.' };
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not update your information.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function changePassword(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const password = req.body.password;
            if (!password || String(password).length < 8) throw 'Enter a password of at least 8 characters.';
            if (password !== req.body.passwordConfirm) throw 'Passwords do not match.';
            const rows = await db.getUserById(conn, { idUser: req.idUser });
            // Google-only users have no password yet, so there is nothing to check.
            if (rows[0].password) {
                const ok = await bcrypt.compare(String(req.body.currentPassword || ''), rows[0].password);
                if (!ok) throw 'Your current password is not correct.';
            }
            const hash = await bcrypt.hash(String(password), 12);
            await db.updatePassword(conn, { idUser: req.idUser, password: hash });
            status = 200;
            response = { message: 'Password updated.' };
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not change the password.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function biometricRemove(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            await db.deletePasskeys(conn, { idUser: req.idUser });
            status = 200;
            response = { message: 'Biometric login removed.' };
        } catch (e) {
            console.log(e);
            response = { message: 'Could not remove biometric login.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function biometricSkip(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            await db.setAskBiometric(conn, { value: 0, idUser: req.idUser });
            status = 200;
            response = { message: 'Biometric prompt closed.' };
        } catch (e) {
            console.log(e);
            response = { message: 'Could not save your choice.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

async function biometricLoginOptions(req, res) {
    let response = {};
    let status = 400;
    try {
        const options = await generateAuthenticationOptions({
            rpID: process.env.WEBAUTHN_RP_ID,
            userVerification: 'required'
        });
        saveChallenge(res, options.challenge);
        status = 200;
        response = options;
    } catch (e) {
        console.log(e);
        response = { message: 'Could not start the biometric login.' };
    } finally {
        res.status(status).send(response);
    }
}

async function biometricLogin(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        let response = {};
        let status = 400;
        let connSuccess = false;
        try {
            if (errConn) throw errConn;
            connSuccess = true;
            const passkey = (await db.getPasskeyByCredential(conn, { credentialId: req.body.id }))[0];
            if (!passkey) throw 'This device is not registered for biometric login.';
            const verification = await verifyAuthenticationResponse({
                response: req.body,
                expectedChallenge: takeChallenge(req, res),
                expectedOrigin: webauthnOrigins(),
                expectedRPID: process.env.WEBAUTHN_RP_ID,
                credential: {
                    id: passkey.credentialId,
                    publicKey: Buffer.from(passkey.publicKey, 'base64url'),
                    counter: Number(passkey.counter),
                    transports: passkey.transports ? passkey.transports.split(',') : undefined
                },
                requireUserVerification: true
            });
            if (!verification.verified) throw 'Could not verify the biometric login.';
            await db.updatePasskeyCounter(conn, { counter: verification.authenticationInfo.newCounter, idPasskey: passkey.idPasskey });

            const user = (await db.getUserById(conn, { idUser: passkey.idUser }))[0];
            if (!user || Number(user.active) !== 1) throw 'Your account is inactive.';

            startSession(res, user);
            status = 200;
            response = { message: 'Welcome!' };
        } catch (e) {
            console.log(e);
            response = { message: typeof e === 'string' ? e : 'Could not verify the biometric login.' };
        } finally {
            if (connSuccess) conn.release();
            res.status(status).send(response);
        }
    });
}

module.exports = router
