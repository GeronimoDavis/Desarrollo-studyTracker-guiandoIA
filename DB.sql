SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS study_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE study_tracker;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(80)     NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  timezone      VARCHAR(64)     NOT NULL DEFAULT 'UTC',
  created_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT chk_users_name
    CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(80)     NOT NULL,
  color       CHAR(7) CHARACTER SET ascii COLLATE ascii_bin
                              NOT NULL DEFAULT '#6366F1',
  description VARCHAR(500)    NULL,
  is_archived TINYINT(1)      NOT NULL DEFAULT 0,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_subjects_user_name (user_id, name),
  KEY idx_subjects_user_archived (user_id, is_archived),
  CONSTRAINT fk_subjects_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_subjects_name
    CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80),
  CONSTRAINT chk_subjects_color
    CHECK (color REGEXP '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT chk_subjects_archived
    CHECK (is_archived IN (0, 1))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- study_sessions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_sessions (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           BIGINT UNSIGNED NOT NULL,
  subject_id        BIGINT UNSIGNED NOT NULL,
  client_id         CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  mode              ENUM('free', 'fixed') NOT NULL,
  status            ENUM('completed', 'abandoned') NOT NULL,
  target_minutes    SMALLINT UNSIGNED NULL,
  break_minutes     TINYINT UNSIGNED NULL,
  break_count       TINYINT UNSIGNED NULL,
  effective_seconds INT UNSIGNED NOT NULL,
  started_at        DATETIME(3) NOT NULL,
  ended_at          DATETIME(3) NOT NULL,
  session_date      DATE NOT NULL,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_user_client (user_id, client_id),
  KEY idx_sessions_user_date (user_id, session_date),
  KEY idx_sessions_user_status_date (user_id, status, session_date),
  KEY idx_sessions_user_subject_date (user_id, subject_id, session_date),
  KEY idx_sessions_user_start_end (user_id, started_at, ended_at),
  KEY idx_sessions_subject (subject_id),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sessions_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_sessions_effective
    CHECK (effective_seconds BETWEEN 1 AND 86400),
  CONSTRAINT chk_sessions_dates
    CHECK (ended_at > started_at),
  CONSTRAINT chk_sessions_mode_status
    CHECK (mode = 'fixed' OR status = 'completed'),
  CONSTRAINT chk_sessions_fixed_plan
    CHECK (
      (
        mode = 'free'
        AND target_minutes IS NULL
        AND break_minutes IS NULL
        AND break_count IS NULL
      )
      OR (
        mode = 'fixed'
        AND target_minutes IS NOT NULL
        AND break_minutes IS NOT NULL
        AND break_count IS NOT NULL
        AND target_minutes IN (30, 60, 120, 180, 240, 300)
        AND break_minutes IN (5, 10, 15)
        AND (
          (target_minutes = 30 AND break_count = 1)
          OR (
            target_minutes IN (60, 120, 180, 240, 300)
            AND (
              (break_minutes = 5  AND break_count * 20 = target_minutes)
              OR (break_minutes = 10 AND break_count * 30 = target_minutes)
              OR (break_minutes = 15 AND break_count * 60 = target_minutes)
            )
          )
        )
      )
    ),
  CONSTRAINT chk_sessions_completion
    CHECK (
      mode = 'free'
      OR (status = 'abandoned' AND effective_seconds < target_minutes * 60)
      OR (status = 'completed' AND ABS(effective_seconds - target_minutes * 60) <= 5)
    )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  user_id            BIGINT UNSIGNED NOT NULL,
  heatmap_thresholds JSON NOT NULL
                     DEFAULT (JSON_ARRAY(60, 120, 240, 480)),
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                     ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_settings_thresholds
    CHECK (
      JSON_TYPE(heatmap_thresholds) = 'ARRAY'
      AND JSON_LENGTH(heatmap_thresholds) = 4
    )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- refresh_tokens
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_hash (token_hash),
  KEY idx_refresh_tokens_user (user_id),
  KEY idx_refresh_tokens_expires (expires_at),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- schema_migrations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   VARCHAR(255) NOT NULL,
  applied_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (filename)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

SHOW TABLES;