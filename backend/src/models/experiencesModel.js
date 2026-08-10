async function getExperiences(conn) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM experiences`;
        conn.query(query, [], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getExperienceByCode(conn, code) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT idExperience, code, title, description, value2, value3, image,
            (SELECT duration FROM routes WHERE code = 'PRE') as duration
        FROM experiences
        WHERE code = ?
        `;
        conn.query(query, [code], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

module.exports = {
    getExperiences,
    getExperienceByCode,
};
