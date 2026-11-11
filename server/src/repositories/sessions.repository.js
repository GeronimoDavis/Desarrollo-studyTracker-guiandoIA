import { pool } from '../config/db.js';

const SESSION_FIELDS = `
  s.id,
  s.user_id,
  s.subject_id,
  s.client_id,
  s.mode,
  s.status,
  s.target_minutes,
  s.break_minutes,
  s.break_count,
  s.effective_seconds,
  s.started_at,
  s.ended_at,
  s.session_date,
  s.created_at,
  sub.name AS subject_name,
  sub.color AS subject_color
`;

function buildFilters(userId, { from, to, subjectId, status, mode } = {}) {
  const conditions = ['s.user_id = ?'];
  const values = [userId];

  if (from) {
    conditions.push('s.session_date >= ?');
    values.push(from);
  }

  if (to) {
    conditions.push('s.session_date <= ?');
    values.push(to);
  }

  if (subjectId) {
    conditions.push('s.subject_id = ?');
    values.push(subjectId);
  }

  if (status) {
    conditions.push('s.status = ?');
    values.push(status);
  }

  if (mode) {
    conditions.push('s.mode = ?');
    values.push(mode);
  }

  return {
    where: conditions.join(' AND '),
    values
  };
}

export async function findByClientId(
  userId,
  clientId,
  connection = pool
) {
  const [rows] = await connection.execute(
    `SELECT ${SESSION_FIELDS}
       FROM study_sessions s
       JOIN subjects sub
         ON sub.id = s.subject_id
        AND sub.user_id = s.user_id
      WHERE s.user_id = ?
        AND s.client_id = ?
      LIMIT 1`,
    [userId, clientId]
  );

  return rows[0] ?? null;
}

export async function insertSession(
  userId,
  {
    subjectId,
    clientId,
    mode,
    status,
    targetMinutes,
    breakMinutes,
    breakCount,
    effectiveSeconds,
    startedAt,
    endedAt,
    sessionDate
  },
  connection = pool
) {
  await connection.execute(
    `INSERT INTO study_sessions
       (user_id, subject_id, client_id, mode, status, target_minutes,
        break_minutes, break_count, effective_seconds, started_at, ended_at,
        session_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      subjectId,
      clientId,
      mode,
      status,
      targetMinutes,
      breakMinutes,
      breakCount,
      effectiveSeconds,
      startedAt,
      endedAt,
      sessionDate
    ]
  );

  return findByClientId(userId, clientId, connection);
}

export async function hasOverlap(
  userId,
  startedAt,
  endedAt,
  excludeClientId = null,
  connection = pool
) {
  const params = [userId, endedAt, startedAt];
  let exclude = '';

  if (excludeClientId) {
    exclude = ' AND client_id <> ?';
    params.push(excludeClientId);
  }

  const [rows] = await connection.execute(
    `SELECT 1 AS overlap
       FROM study_sessions
      WHERE user_id = ?
        AND started_at < ?
        AND ended_at > ?
        ${exclude}
      LIMIT 1`,
    params
  );

  return rows.length > 0;
}

export async function listSessions(
  userId,
  { from, to, subjectId, status, mode, limit = 50, offset = 0 } = {},
  connection = pool
) {
  const { where, values } = buildFilters(userId, {
    from,
    to,
    subjectId,
    status,
    mode
  });

  const [rows] = await connection.execute(
    `SELECT ${SESSION_FIELDS}
       FROM study_sessions s
       JOIN subjects sub
         ON sub.id = s.subject_id
        AND sub.user_id = s.user_id
      WHERE ${where}
      ORDER BY s.started_at DESC, s.id DESC
      LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return rows;
}

export async function countSessions(
  userId,
  { from, to, subjectId, status, mode } = {},
  connection = pool
) {
  const { where, values } = buildFilters(userId, {
    from,
    to,
    subjectId,
    status,
    mode
  });

  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total
       FROM study_sessions s
      WHERE ${where}`,
    values
  );

  return Number(rows[0]?.total ?? 0);
}

export async function sumDaily(userId, date, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT s.subject_id,
            sub.name AS subject_name,
            sub.color AS subject_color,
            COALESCE(SUM(s.effective_seconds), 0) AS effective_seconds,
            COUNT(*) AS sessions
       FROM study_sessions s
       JOIN subjects sub
         ON sub.id = s.subject_id
        AND sub.user_id = s.user_id
      WHERE s.user_id = ?
        AND s.session_date = ?
      GROUP BY s.subject_id, sub.name, sub.color
      ORDER BY effective_seconds DESC, sub.name ASC`,
    [userId, date]
  );

  return rows;
}

export async function sumBySubjectRange(
  userId,
  startDate,
  endDate,
  connection = pool
) {
  const [rows] = await connection.execute(
    `SELECT s.subject_id,
            sub.name AS subject_name,
            sub.color AS subject_color,
            COALESCE(SUM(s.effective_seconds), 0) AS effective_seconds,
            COUNT(*) AS sessions
       FROM study_sessions s
       JOIN subjects sub
         ON sub.id = s.subject_id
        AND sub.user_id = s.user_id
      WHERE s.user_id = ?
        AND s.session_date BETWEEN ? AND ?
      GROUP BY s.subject_id, sub.name, sub.color
      ORDER BY effective_seconds DESC, sub.name ASC`,
    [userId, startDate, endDate]
  );

  return rows;
}

export async function sumByDayRange(
  userId,
  startDate,
  endDate,
  connection = pool
) {
  const [rows] = await connection.execute(
    `SELECT session_date,
            COALESCE(SUM(effective_seconds), 0) AS effective_seconds,
            COUNT(*) AS sessions
       FROM study_sessions
      WHERE user_id = ?
        AND session_date BETWEEN ? AND ?
      GROUP BY session_date
      ORDER BY session_date ASC`,
    [userId, startDate, endDate]
  );

  return rows;
}

export async function listCompletedDates(userId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT DISTINCT session_date
       FROM study_sessions
      WHERE user_id = ?
        AND status = 'completed'
      ORDER BY session_date DESC`,
    [userId]
  );

  return rows;
}
