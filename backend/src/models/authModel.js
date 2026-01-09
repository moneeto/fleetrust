async function getUserByUsername(conn, p) {
    return new Promise((resolve, reject) => {
        let query = `SELECT a.idUser, a.username, a.password, a.name, a.surname, a.idRole, b.role
                    FROM users a 
                    INNER JOIN roles b ON b.idRole = a.idRole
                    WHERE a.username = ?
            `
        let params = [p.username]

        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

    })
}


module.exports = {
    getUserByUsername
}