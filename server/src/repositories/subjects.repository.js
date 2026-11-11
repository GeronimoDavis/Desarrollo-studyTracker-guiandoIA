import { pool } from '../config/db.js';

const SUBJECT_FIELDS = `
  id,
  name,
  color,
  description,
  is_archived,
  created_at,
  updated_at
`;

export async function listSubjects(
  userId,
  { includeArchived = false } = {},
  connection = pool
) {
  const archivedFilter = includeArchived ? '' : 'AND is_archived = 0';

  const [rows] = await connection.execute(
    `SELECT ${SUBJECT_FIELDS}
       FROM subjects
      WHERE user_id = ?
        ${archivedFilter}
      ORDER BY is_archived ASC, name ASC`,
    [userId]
  );

  return rows;
}

export async function findById(userId, subjectId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${SUBJECT_FIELDS}
       FROM subjects
      WHERE id = ?
        AND user_id = ?
      LIMIT 1`,
    [subjectId, userId]
  );

  return rows[0] ?? null;
}

export async function createSubject(
  userId,
  { name, color, description },
  connection = pool
) {
  const [result] = await connection.execute(
    `INSERT INTO subjects (user_id, name, color, description)
     VALUES (?, ?, ?, ?)`,
    [userId, name, color, description ?? null]
  );

  return findById(userId, result.insertId, connection);
}

export async function updateSubject(
  userId,
  subjectId,
  { name, color, description },
  connection = pool
) {
  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push('name = ?');
    values.push(name);
  }

  if (color !== undefined) {
    fields.push('color = ?');
    values.push(color);
  }

  if (description !== undefined) {
    fields.push('description = ?');
    values.push(description);
  }

  if (fields.length > 0) {
    values.push(subjectId, userId);

    await connection.execute(
      `UPDATE subjects
          SET ${fields.join(', ')}
        WHERE id = ?
          AND user_id = ?`,
      values
    );
  }

  return findById(userId, subjectId, connection);
}

export async function setArchived(
  userId,
  subjectId,
  isArchived,
  connection = pool
) {
  await connection.execute(
    `UPDATE subjects
        SET is_archived = ?
      WHERE id = ?
        AND user_id = ?`,
    [isArchived ? 1 : 0, subjectId, userId]
  );

  return findById(userId, subjectId, connection);
}

export async function deleteSubject(userId, subjectId, connection = pool) {
  const [result] = await connection.execute(
    `DELETE FROM subjects
      WHERE id = ?
        AND user_id = ?`,
    [subjectId, userId]
  );

  return result.affectedRows;
}

export async function countSessions(userId, subjectId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total
       FROM study_sessions
      WHERE user_id = ?
        AND subject_id = ?`,
    [userId, subjectId]
  );

  return Number(rows[0]?.total ?? 0);
}

export async function getTotals(
  userId,
  subjectId,
  startDate,
  endDate,
  connection = pool
) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(SUM(effective_seconds), 0) AS effective_seconds,
            COUNT(*) AS sessions
       FROM study_sessions
      WHERE user_id = ?
        AND subject_id = ?
        AND session_date BETWEEN ? AND ?`,
    [userId, subjectId, startDate, endDate]
  );

  return {
    effectiveSeconds: Number(rows[0]?.effective_seconds ?? 0),
    sessions: Number(rows[0]?.sessions ?? 0)
  };
}

export async function getActivitySummary(
  userId,
  subjectId,
  connection = pool
) {
  const [rows] = await connection.execute(
    `SELECT MAX(session_date) AS last_study_date,
            COUNT(*) AS total_sessions
       FROM study_sessions
      WHERE user_id = ?
        AND subject_id = ?`,
    [userId, subjectId]
  );

  return {
    lastStudyDate: rows[0]?.last_study_date ?? null,
    totalSessions: Number(rows[0]?.total_sessions ?? 0)
  };
}

export async function listRecentSessions(
  userId,
  subjectId,
  limit = 5,
  connection = pool
) {
  const [rows] = await connection.execute(
    `SELECT id,
            mode,
            status,
            effective_seconds,
            started_at,
            ended_at,
            session_date,
            created_at
       FROM study_sessions
      WHERE user_id = ?
        AND subject_id = ?
      ORDER BY session_date DESC, started_at DESC
      LIMIT ?`,
    [userId, subjectId, limit]
  );

  return rows;
}
