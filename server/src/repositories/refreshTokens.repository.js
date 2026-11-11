import { createHash } from 'node:crypto';
import { pool } from '../config/db.js';

const REFRESH_TOKEN_FIELDS = `
  id,
  user_id,
  token_hash,
  expires_at,
  revoked_at,
  created_at
`;

export function hashRefreshToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

export async function createRefreshToken(
  { userId, token, expiresAt },
  connection = pool
) {
  const tokenHash = hashRefreshToken(token);

  await connection.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function findByToken(
  token,
  connection = pool,
  { forUpdate = false } = {}
) {
  const tokenHash = hashRefreshToken(token);
  const lock = forUpdate ? ' FOR UPDATE' : '';

  const [rows] = await connection.execute(
    `SELECT ${REFRESH_TOKEN_FIELDS}
       FROM refresh_tokens
      WHERE token_hash = ?
      LIMIT 1${lock}`,
    [tokenHash]
  );

  return rows[0] ?? null;
}

export async function revokeById(id, connection = pool) {
  await connection.execute(
    `UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP(3)
      WHERE id = ?
        AND revoked_at IS NULL`,
    [id]
  );
}

export async function revokeAllForUser(userId, connection = pool) {
  await connection.execute(
    `UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ?
        AND revoked_at IS NULL`,
    [userId]
  );
}

export async function deleteExpired(connection = pool) {
  const [result] = await connection.execute(
    `DELETE FROM refresh_tokens
      WHERE expires_at < CURRENT_TIMESTAMP(3)`
  );

  return result.affectedRows;
}
