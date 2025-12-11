const express = require('express');
const router = express.Router();
const connection = require('../helpers/conexion-mysql')
const db = require('../models/authModel.js')
const {addLog} = require('../helpers/addLog.js')

router.post('/login', login);

async function login(req, res) {
    connection.pool.getConnection(async (errConn, conn) => {
        
        let response = {}
        let status = 400
        let errMsg = "Authentication error."
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

            userData = userData[0];

            if (parseInt(userData.active) == 0) {
                //Significa que es usuario inactivo, no deberia poder logear
                errMsg = "Invalid username or password. Please, verify your credentials and try again."
                throw "No tiene permisos y/o usuario inactivo."
            }

            //Verifico la password
            const match = await bcrypt.compare(params.password, userData.password);
            if (!match) {
                errMsg = "Invalid username or password. Please, verify your credentials and try again."
                throw `Contraseña incorrecta para el usuario ${params.username}`
            }

            //Genero el token
            const payload = { ...userData }

            const token = jwt.sign(payload, process.env.SECRET_STRING, { expiresIn: process.env.TOKEN_EXPIRATION });

            let expires = moment().add(120, 'days').toDate()

            res.cookie('token', token, { expires, httpOnly: true });

            let reestablecer_password = userData.resetPassword
            if (reestablecer_password == 1) {
                status = 200
                response = { mensaje: "Your account needs a password update, please change it.", data: { ...userData, resetPassword: 1 } }
            } else {
                status = 200
                response = {
                    mensaje: "Welcome!", data: {}
                }
            }

            await addLog({
                idUser: payload.idUsuario,
                section: "AUTH",
                logLevel: "INFO",
                funct: "login",
                msg: "LOGIN SUCCESS"
            })
        }
        catch (e) {
            let msg = "An internal error has ocurred, please try again or contact support.";
            if (msg.message) { msg = msg.message }
            if (typeof msg == "object") { msg = JSON.stringify(msg) }
            await addLog({
                seccion: "AUTH",
                logLevel: "ERROR",
                funcion: "login",
                msg: msg
            })
            status = 500
            response = { status: "err", mensaje: msg }
        }
        finally {
            if (connSuccess) conn.release()
            res.status(status).send(response)
        }
    })
}

module.exports = router