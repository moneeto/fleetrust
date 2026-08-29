CREATE TABLE IF NOT EXISTS google_place_meta (
    brand VARCHAR(32) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT NULL,
    user_ratings_total INT DEFAULT 0,
    synced_at DATETIME DEFAULT NULL,
    PRIMARY KEY (brand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS google_reviews (
    id INT NOT NULL AUTO_INCREMENT,
    brand VARCHAR(32) NOT NULL,
    google_review_id VARCHAR(191) NOT NULL,
    author_name VARCHAR(255) DEFAULT NULL,
    author_photo VARCHAR(1024) DEFAULT NULL,
    rating TINYINT DEFAULT NULL,
    review_text TEXT,
    relative_time VARCHAR(128) DEFAULT NULL,
    review_time BIGINT DEFAULT NULL,
    owner_response_text TEXT,
    owner_response_time BIGINT DEFAULT NULL,
    visible TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_google_reviews_brand_gid (brand, google_review_id),
    KEY idx_google_reviews_brand_visible (brand, visible, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS instagram_posts (
    id INT NOT NULL AUTO_INCREMENT,
    brand VARCHAR(32) NOT NULL,
    permalink VARCHAR(512) NOT NULL,
    shortcode VARCHAR(64) NOT NULL,
    media_kind VARCHAR(16) NOT NULL DEFAULT 'p',
    visible TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_instagram_brand_shortcode (brand, shortcode),
    KEY idx_instagram_brand_visible (brand, visible, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
