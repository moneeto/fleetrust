function query(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

function listReviews(conn, brand) {
    return query(
        conn,
        `SELECT * FROM google_reviews WHERE brand = ? ORDER BY sort_order ASC, id ASC`,
        [brand]
    );
}

function listVisibleReviews(conn, brand) {
    return query(
        conn,
        `SELECT * FROM google_reviews WHERE brand = ? AND visible = 1 ORDER BY sort_order ASC, id ASC`,
        [brand]
    );
}

function getPlaceMeta(conn, brand) {
    return query(conn, `SELECT * FROM google_place_meta WHERE brand = ?`, [brand]).then((rows) => rows[0] || null);
}

function upsertPlaceMeta(conn, { brand, rating, userRatingsTotal }) {
    return query(
        conn,
        `INSERT INTO google_place_meta (brand, rating, user_ratings_total, synced_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
            rating = VALUES(rating),
            user_ratings_total = VALUES(user_ratings_total),
            synced_at = VALUES(synced_at)`,
        [brand, rating, userRatingsTotal]
    );
}

function getReviewByGoogleId(conn, brand, googleReviewId) {
    return query(
        conn,
        `SELECT id, visible, sort_order FROM google_reviews WHERE brand = ? AND google_review_id = ?`,
        [brand, googleReviewId]
    ).then((rows) => rows[0] || null);
}

function maxReviewSort(conn, brand) {
    return query(
        conn,
        `SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM google_reviews WHERE brand = ?`,
        [brand]
    ).then((rows) => Number(rows[0]?.maxOrder ?? -1));
}

function insertReview(conn, row) {
    return query(
        conn,
        `INSERT INTO google_reviews
            (brand, google_review_id, author_name, author_photo, rating, review_text,
             relative_time, review_time, owner_response_text, owner_response_time, visible, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
            row.brand,
            row.googleReviewId,
            row.authorName,
            row.authorPhoto,
            row.rating,
            row.reviewText,
            row.relativeTime,
            row.reviewTime,
            row.ownerResponseText,
            row.ownerResponseTime,
            row.sortOrder,
        ]
    );
}

function updateReviewContent(conn, id, row) {
    return query(
        conn,
        `UPDATE google_reviews SET
            author_name = ?,
            author_photo = ?,
            rating = ?,
            review_text = ?,
            relative_time = ?,
            review_time = ?,
            owner_response_text = ?,
            owner_response_time = ?
         WHERE id = ?`,
        [
            row.authorName,
            row.authorPhoto,
            row.rating,
            row.reviewText,
            row.relativeTime,
            row.reviewTime,
            row.ownerResponseText,
            row.ownerResponseTime,
            id,
        ]
    );
}

function updateReviewVisible(conn, id, brand, visible) {
    return query(
        conn,
        `UPDATE google_reviews SET visible = ? WHERE id = ? AND brand = ?`,
        [visible ? 1 : 0, id, brand]
    );
}

function updateReviewOrder(conn, brand, ids) {
    const statements = ids.map((id, index) =>
        query(conn, `UPDATE google_reviews SET sort_order = ? WHERE id = ? AND brand = ?`, [index, id, brand])
    );
    return Promise.all(statements);
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

function getReviewById(conn, id, brand) {
    return query(
        conn,
        `SELECT * FROM google_reviews WHERE id = ? AND brand = ?`,
        [id, brand]
    ).then((rows) => rows[0] || null);
}

module.exports = {
    listReviews,
    listVisibleReviews,
    getPlaceMeta,
    upsertPlaceMeta,
    getReviewByGoogleId,
    maxReviewSort,
    insertReview,
    updateReviewContent,
    updateReviewVisible,
    updateReviewOrder,
    listInstagram,
    listVisibleInstagram,
    maxInstagramSort,
    insertInstagram,
    updateInstagramVisible,
    updateInstagramOrder,
    deleteInstagram,
    getInstagramById,
    getReviewById,
};
