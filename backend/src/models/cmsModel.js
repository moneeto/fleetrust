function query(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

function listReviews(conn, target) {
    return query(
        conn,
        `SELECT id, name, stars, review, target, sort_order FROM reviews WHERE target = ? ORDER BY sort_order ASC, id ASC`,
        [target]
    );
}

function maxReviewSort(conn, target) {
    return query(
        conn,
        `SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM reviews WHERE target = ?`,
        [target]
    ).then((rows) => Number(rows[0]?.maxOrder ?? -1));
}

function insertReview(conn, row) {
    return query(
        conn,
        `INSERT INTO reviews (name, stars, review, target, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [row.name, row.stars, row.review, row.target, row.sortOrder]
    );
}

function updateReviewOrder(conn, target, ids) {
    const statements = ids.map((id, index) =>
        query(conn, `UPDATE reviews SET sort_order = ? WHERE id = ? AND target = ?`, [index, id, target])
    );
    return Promise.all(statements);
}

function deleteReview(conn, id, target) {
    return query(conn, `DELETE FROM reviews WHERE id = ? AND target = ?`, [id, target]);
}

function listInstagram(conn, brand) {
    return query(
        conn,
        `SELECT * FROM instagram_posts WHERE brand = ? ORDER BY sort_order ASC, id ASC`,
        [brand]
    );
}

function listVisibleInstagram(conn, brand) {
    return query(
        conn,
        `SELECT * FROM instagram_posts WHERE brand = ? AND visible = 1 ORDER BY sort_order ASC, id ASC`,
        [brand]
    );
}

function maxInstagramSort(conn, brand) {
    return query(
        conn,
        `SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM instagram_posts WHERE brand = ?`,
        [brand]
    ).then((rows) => Number(rows[0]?.maxOrder ?? -1));
}

function insertInstagram(conn, row) {
    return query(
        conn,
        `INSERT INTO instagram_posts (brand, permalink, shortcode, media_kind, visible, sort_order)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [row.brand, row.permalink, row.shortcode, row.mediaKind, row.sortOrder]
    );
}

function updateInstagramVisible(conn, id, brand, visible) {
    return query(
        conn,
        `UPDATE instagram_posts SET visible = ? WHERE id = ? AND brand = ?`,
        [visible ? 1 : 0, id, brand]
    );
}

function updateInstagramOrder(conn, brand, ids) {
    const statements = ids.map((id, index) =>
        query(conn, `UPDATE instagram_posts SET sort_order = ? WHERE id = ? AND brand = ?`, [index, id, brand])
    );
    return Promise.all(statements);
}

function deleteInstagram(conn, id, brand) {
    return query(conn, `DELETE FROM instagram_posts WHERE id = ? AND brand = ?`, [id, brand]);
}

function getInstagramById(conn, id, brand) {
    return query(
        conn,
        `SELECT * FROM instagram_posts WHERE id = ? AND brand = ?`,
        [id, brand]
    ).then((rows) => rows[0] || null);
}

module.exports = {
    listReviews,
    maxReviewSort,
    insertReview,
    updateReviewOrder,
    deleteReview,
    listInstagram,
    listVisibleInstagram,
    maxInstagramSort,
    insertInstagram,
    updateInstagramVisible,
    updateInstagramOrder,
    deleteInstagram,
    getInstagramById,
};
