import { pool } from '../config/db.js';

export const DEFAULT_HEATMAP_THRESHOLDS = [60, 120, 240, 480];

export async function createDefaults(userId, connection = pool) {
  await connection.execute(
    `INSERT INTO user_settings (user_id, heatmap_thresholds)
     VALUES (?, ?)`,
    [userId, JSON.stringify(DEFAULT_HEATMAP_THRESHOLDS)]
  );
}

export async function findByUserId(userId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT user_id, heatmap_thresholds, created_at, updated_at
       FROM user_settings
      WHERE user_id = ?
      LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}

export async function upsert(userId, thresholds, connection = pool) {
  const serialized = JSON.stringify(thresholds);

  await connection.execute(
    `INSERT INTO user_settings (user_id, heatmap_thresholds)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE heatmap_thresholds = ?`,
    [userId, serialized, serialized]
  );

  return findByUserId(userId, connection);
}
