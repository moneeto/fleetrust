const connection = require('../helpers/conexion-mysql.js')

async function addLog(p) {
    return new Promise((resolve, reject) => {
        connection.pool.getConnection((errConn, conn) => {
            if (errConn) return reject(errConn);
            let msg = p.msg

            if (!msg){
                msg = "Mensaje vacio"
            }
            if (typeof msg === 'object'){
                try {
                    msg = JSON.stringify(msg)
                } catch (error) {
                    msg = "No se pudo convertir el mensaje"
                }
            }
            if (msg instanceof Error){
                msg = msg.message
            }

            const query = `
                INSERT INTO logs(idUser,section,function,msg, logLevel)
                VALUES (?,?,?,?,?)
            `;
            const params = [p.idUser, p.section, p.function, msg, p.logLevel];

            conn.query(query, params, (err, results) => {
                conn.release()
                if (err) return reject(err);
                resolve(results);
            });
        });
    });
}

module.exports = {
    addLog
}