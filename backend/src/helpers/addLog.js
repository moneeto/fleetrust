const dbLog = require('../models/logModel')

function addLog({ section, idUser, logLevel, funct, msg }) {
    return new Promise(async (resolve, reject) => {
        try {

            let params = {
                idUser: idUser ? idUser : null,
                section: section ? section : null,
                logLevel: logLevel ? logLevel : null,
                function: funct ? funct : null,
                msg: msg ? msg : null,
            }

            await dbLog.addLog(params)

            resolve()
        } catch (error) {
            resolve()
        }
    })
}

module.exports = {
    addLog
}