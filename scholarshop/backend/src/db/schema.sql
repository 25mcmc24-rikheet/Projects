-- ScholarShop schema (MySQL 8, InnoDB, utf8mb4)
-- Idempotent: drops + recreates all tables.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS email_verifications;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  college       VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  avatar_url    VARCHAR(500),
  is_verified   TINYINT(1) NOT NULL DEFAULT 0,
  rating_avg    DECIMAL(3,2) NOT NULL DEFAULT 0,
  rating_count  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_college (college)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_verifications (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  otp_hash   VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed   TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ev_user (user_id, consumed),
  INDEX idx_ev_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE refresh_tokens (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  revoked     TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_user (user_id, revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  seller_id     BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT NOT NULL,
  category      VARCHAR(60) NOT NULL,
  listing_type  ENUM('sell','rent') NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  rent_unit     ENUM('hour','day','week','month') NULL,
  condition_tag ENUM('new','like_new','good','fair') DEFAULT 'good',
  city          VARCHAR(80) NOT NULL,
  college       VARCHAR(150) NOT NULL,
  status        ENUM('active','sold','rented','hidden') DEFAULT 'active',
  views         INT UNSIGNED DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_products_search (status, category, listing_type, city),
  INDEX idx_products_seller (seller_id),
  FULLTEXT KEY ft_products (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product_images (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  position   TINYINT UNSIGNED DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_pi_product (product_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id   BIGINT UNSIGNED NOT NULL,
  buyer_id     BIGINT UNSIGNED NOT NULL,
  seller_id    BIGINT UNSIGNED NOT NULL,
  type         ENUM('sell','rent') NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  rent_from    DATE NULL,
  rent_to      DATE NULL,
  status       ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (buyer_id)   REFERENCES users(id),
  FOREIGN KEY (seller_id)  REFERENCES users(id),
  INDEX idx_orders_buyer  (buyer_id, status),
  INDEX idx_orders_seller (seller_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE conversations (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id      BIGINT UNSIGNED NOT NULL,
  buyer_id        BIGINT UNSIGNED NOT NULL,
  seller_id       BIGINT UNSIGNED NOT NULL,
  last_message_at TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_conv (product_id, buyer_id, seller_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id)   REFERENCES users(id),
  FOREIGN KEY (seller_id)  REFERENCES users(id),
  INDEX idx_conv_buyer  (buyer_id,  last_message_at),
  INDEX idx_conv_seller (seller_id, last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE messages (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id       BIGINT UNSIGNED NOT NULL,
  body            TEXT NOT NULL,
  read_at         TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_msg_conv_time (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wishlist (
  user_id    BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_wishlist_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reviews (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reviewer_id  BIGINT UNSIGNED NOT NULL,
  reviewee_id  BIGINT UNSIGNED NOT NULL,
  product_id   BIGINT UNSIGNED NOT NULL,
  order_id     BIGINT UNSIGNED NOT NULL,
  rating       TINYINT NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_review_per_order (order_id, reviewer_id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_id) REFERENCES users(id),
  FOREIGN KEY (product_id)  REFERENCES products(id),
  FOREIGN KEY (order_id)    REFERENCES orders(id),
  INDEX idx_reviews_reviewee (reviewee_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       ENUM('message','order','review','listing_reported','listing_hidden') NOT NULL,
  payload    JSON NOT NULL,
  read_at    TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user_unread (user_id, read_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reports (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  reporter_id BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  reason      VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_report (reporter_id, product_id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (product_id)  REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_reports_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
