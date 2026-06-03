const express = require('express');
const router = express.Router();
const connection = require('../helpers/conexion-mysql')
const db = require('../models/authModel.js')
const { addLog } = require('../helpers/addLog.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');

router.post('/login', login);
router.get('/logout', logout);

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
                username: req.body.username && req.body.username != null ? req.body.username : null,
                password: req.body.password && req.body.password != null ? req.body.password : null
            }

            if (!params.username || !params.password) {
                errMsg = "Invalid username or password. Please, verify your credentials and try again."
                throw "No se envio usuario y/o contraseña"
            }

            if (process.env.UTILIZAR_CAPTCHA == 'true') {
                // if (!req.body.captchaToken) {
                //     throw "Internal error."
                // }
                //Validación de captcha
                // const captchaResults = await getCaptcha(req.body.captchaToken);

                // if (!captchaResults.success || captchaResults.score < process.env.CAPTCHA_SCORE_MINIMO) {
                //     errMsg = "Authentication error. The system detected suspicious activity."
                //     throw Error("Sos un robot.")
                // }
            }

            let userData = await db.getUserByUsername(conn, params)

            if (!userData || !userData[0] || !userData[0].idUser) {
                errMsg = "Invalid username or password. Please, verify your credentials and try again."
                throw `No se ha encontrado el usuario ${params.username}`
            }

            encryptionPayload = {
                idUser: userData[0].idUser,
                username: userData[0].username,
                idRole: userData[0].idRole,
                role: userData[0].role,
                name: userData[0].name,
                surname: userData[0].surname,
                active: userData[0].active,
                resetPassword: userData[0].resetPassword
            };

            if (parseInt(userData[0].active) == 0) {
                //Significa que es usuario inactivo, no deberia poder logear
                errMsg = "Invalid username or password. Please, verify your credentials and try again."
                throw "No tiene permisos y/o usuario inactivo."
            }

            //Verifico la password
            const match = await bcrypt.compare(params.password, userData[0].password);
            if (!match) {
                errMsg = "Invalid username or password. Please, verify your credentials and try again."
                throw `Contraseña incorrecta para el usuario ${params.username}`
            }

            //Genero el token

            const token = jwt.sign(encryptionPayload, process.env.SECRET_STRING, { expiresIn: process.env.TOKEN_EXPIRATION });

            let expires = moment().add(120, 'days').toDate()

            res.cookie('token', token, { expires, httpOnly: true,secure: true,
    sameSite: "none", domain: ".frassiaviation.com" });

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
    res.clearCookie('token',{httpOnly: true,secure: true,
    sameSite: "none", domain: ".frassiaviation.com" });
    res.status(200).send({})
}

module.exports = router
