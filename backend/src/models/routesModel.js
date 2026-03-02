async function getRoutes(conn, p) {
    return new Promise((resolve, reject) => {
        let query = ` SELECT idRoute, value2, value3, code, title, description, durationMinutes, duration, image FROM routes WHERE 1=1 `
        let params = []

        conn.query(query, params, (err, results) => {
            if (err) return reject(err)

            resolve(results)
        })

    })
}


module.exports = {
    getRoutes
}