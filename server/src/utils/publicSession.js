function toIsoString(value) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function toNullableNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export function toPublicSession(row, subject = null) {
  if (!row) {
    return null;
  }

  const subjectRow =
    subject ??
    (row.subject_name
      ? {
          id: row.subject_id,
          name: row.subject_name,
          color: row.subject_color
        }
      : null);

  return {
    id: Number(row.id),
    clientId: row.client_id,
    subjectId: Number(row.subject_id),
    subject: subjectRow
      ? {
          id: Number(subjectRow.id ?? row.subject_id),
          name: subjectRow.name,
          color: subjectRow.color
        }
      : undefined,
    mode: row.mode,
    status: row.status,
    targetMinutes: toNullableNumber(row.target_minutes),
    breakMinutes: toNullableNumber(row.break_minutes),
    breakCount: toNullableNumber(row.break_count),
    effectiveSeconds: Number(row.effective_seconds),
    effectiveMinutes: Math.floor(Number(row.effective_seconds) / 60),
    startedAt: toIsoString(row.started_at),
    endedAt: toIsoString(row.ended_at),
    sessionDate: row.session_date,
    createdAt: toIsoString(row.created_at)
  };
}
