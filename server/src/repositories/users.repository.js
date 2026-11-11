import { pool } from '../config/db.js';

const USER_FIELDS = `
  id,
  name,
  email,
  password_hash,
  timezone,
  created_at,
  updated_at
`;

export async function createUser(
  { name, email, passwordHash, timezone },
  connection = pool
) {
  const [result] = await connection.execute(
    `INSERT INTO users (name, email, password_hash, timezone)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, timezone]
  );

  return findById(result.insertId, connection);
}

export async function findByEmail(email, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${USER_FIELDS}
       FROM users
      WHERE email = ?
      LIMIT 1`,
    [email]
  );

  return rows[0] ?? null;
}

export async function findById(id, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${USER_FIELDS}
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [id]
  );

  return rows[0] ?? null;
}

export async function updateProfile(
  userId,
  { name, timezone },
  connection = pool
) {
  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push('name = ?');
    values.push(name);
  }

  if (timezone !== undefined) {
    fields.push('timezone = ?');
    values.push(timezone);
  }

  if (fields.length === 0) {
    return findById(userId, connection);
  }

  values.push(userId);

  await connection.execute(
    `UPDATE users
        SET ${fields.join(', ')}
      WHERE id = ?`,
    values
  );

  return findById(userId, connection);
}

export async function updatePassword(
  userId,
  passwordHash,
  connection = pool
) {
  await connection.execute(
    `UPDATE users
        SET password_hash = ?
      WHERE id = ?`,
    [passwordHash, userId]
  );
}
