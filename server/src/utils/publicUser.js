function toIsoString(value) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export function toPublicUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    timezone: row.timezone,
    createdAt: toIsoString(row.created_at)
  };
}
